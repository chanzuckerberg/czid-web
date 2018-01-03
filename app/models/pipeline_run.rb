require 'open3'
require 'json'
class PipelineRun < ApplicationRecord
  include ApplicationHelper
  belongs_to :sample
  has_one :pipeline_output
  has_many :pipeline_run_stages
  accepts_nested_attributes_for :pipeline_run_stages

  OUTPUT_JSON_NAME = 'idseq_web_sample.json'.freeze
  STATS_JSON_NAME = 'stats.json'.freeze
  TAXID_BYTERANGE_JSON_NAME = 'taxid_locations_combined.json'.freeze
  LOCAL_JSON_PATH = '/app/tmp/results_json'.freeze
  STATUS_CHECKED = 'CHECKED'.freeze
  STATUS_SUCCESS = 'SUCCEEDED'.freeze
  STATUS_FAILED = 'FAILED'.freeze
  STATUS_RUNNING = 'RUNNING'.freeze
  STATUS_RUNNABLE = 'RUNNABLE'.freeze
  STATUS_ERROR = 'ERROR'.freeze # when aegea batch describe failed
  STATUS_LOADED = 'LOADED'.freeze
  POSTPROCESS_STATUS_LOADED = 'LOADED'.freeze

  before_create :create_run_stages
  before_save :check_job_status
  after_create :kickoff_job

  def archive_s3_path
    's3://#{SAMPLES_BUCKET_NAME}/pipeline_runs/#{id}'
  end

  def self.in_progress
    where("job_status != '#{STATUS_FAILED}' OR job_status IS NULL")
      .where(finalized: 0)
  end

  def finalized?
    finalized == 1
  end

  def kickoff_job
    pipeline_run_stages.first.run_job
  end

  def create_run_stages
    # Host Filtering
    run_stages = []
    unless sample.host_genome && sample.host_genome.name == HostGenome::NO_HOST_NAME
      run_stages << PipelineRunStage.new(
        step_number: 1,
        name: 'Host Filtering',
        job_command_func: 'host_filtering_command',
        load_db_command_func: 'db_load_host_filtering',
        output_func: 'host_filtering_outputs'
      )
    end

    # Alignment and Merging
    run_stages << PipelineRunStage.new(
      step_number: 2,
      name: 'GSNAPL/RAPSEARCH alignment',
      job_command_func: 'alignment_command',
      load_db_command_func: 'db_load_alignment',
      output_func: 'alignment_outputs'
    )
    # Post Processing
    run_stages << PipelineRunStage.new(
      step_number: 3,
      name: 'Post Processing',
      job_command_func: 'postprocess_command',
      load_db_command_func: 'db_load_postprocess',
      output_func: 'postprocess_outputs'
    )
    self.pipeline_run_stages = run_stages
  end

  def check_job_status
    # only update the pipeline_run info. do not update pipeline_run_stage info
    return if finalized? || id.nil?
    check_job_status_old if pipeline_run_stages.blank?
    pipeline_run_stages.order(:step_number).each do |prs|
      if prs.failed?
        self.finalized = 1
        self.job_status = "#{prs.step_number}.#{prs.name}-#{STATUS_FAILED}"
        Airbrake.notify("Sample #{sample.id} failed #{prs.name}")
        return nil
      elsif prs.succeeded?
        next
      else # still running
        self.job_status = "#{prs.step_number}.#{prs.name}-#{prs.job_status}"
        return nil
      end
    end
    # All done
    self.finalized = 1
    self.job_status = STATUS_CHECKED
  end

  def check_job_status_old # Before pipeline_run_stages are introduced
    if pipeline_output
      self.job_status = STATUS_CHECKED
      return
    end
    if output_ready?
      # Try loading the data into DB after 24 hours running the job
      self.job_status = STATUS_CHECKED
      Resque.enqueue(LoadResultsFromS3, id)
      # terminate the job
      terminate_job
    end
  end

  def output_ready?
    output_json_s3_path = "#{sample.sample_output_s3_path}/#{OUTPUT_JSON_NAME}"
    stats_json_s3_path = "#{sample.sample_output_s3_path}/#{STATS_JSON_NAME}"
    byteranges_json_s3_path = "#{sample.sample_postprocess_s3_path}/#{TAXID_BYTERANGE_JSON_NAME}"
    # check the existence of all 3 and make sure they are all generated after pr.created_at
    file_generated_since_run(output_json_s3_path) && file_generated_since_run(stats_json_s3_path) && file_generated_since_run(byteranges_json_s3_path)
  end

  def completed?
    return true if finalized?
    # Old version before run stages
    return true if pipeline_run_stages.blank? && (pipeline_output || job_status == STATUS_FAILED)
  end

  def log_url
    return nil unless job_log_id
    "https://us-west-2.console.aws.amazon.com/cloudwatch/home?region=us-west-2" \
      "#logEventViewer:group=/aws/batch/job;stream=#{job_log_id}"
  end

  def update_job_status
    update_job_status_old if pipeline_run_stages.blank?
    pipeline_run_stages.order(:step_number).each do |prs|
      if !prs.started? # Not started yet
        prs.run_job
        break
      elsif prs.succeeded?
        # great do nothing. go to the next step.
        next
      elsif prs.failed?
        break
      else # This step is still running
        prs.update_job_status
        break
      end
    end
    save
  end

  def update_job_status_old
    return if completed?
    command = "aegea batch describe #{job_id}"
    stdout, stderr, status = Open3.capture3(command)
    if status.exitstatus.zero?
      self.job_description = stdout
      job_hash = JSON.parse(job_description)
      self.job_status = job_hash['status']
      if job_hash['container'] && job_hash['container']['logStreamName']
        self.job_log_id = job_hash['container']['logStreamName']
      end
    else
      Airbrake.notify("Error for update job status for pipeline run #{id} with error #{stderr}")
      self.job_status = STATUS_ERROR
      self.job_status = STATUS_FAILED if stderr =~ /IndexError/ # job no longer exists
    end
    save
  end

  def local_json_path
    "#{LOCAL_JSON_PATH}/#{id}"
  end

  def load_results_from_s3
    return if pipeline_output
    output_json_s3_path = "#{sample.sample_output_s3_path}/#{OUTPUT_JSON_NAME}"
    stats_json_s3_path = "#{sample.sample_output_s3_path}/#{STATS_JSON_NAME}"

    # Get the file
    downloaded_json_path = PipelineRun.download_file(output_json_s3_path, local_json_path)
    downloaded_stats_path = PipelineRun.download_file(stats_json_s3_path, local_json_path)
    return unless downloaded_json_path && downloaded_stats_path
    json_dict = JSON.parse(File.read(downloaded_json_path))
    stats_array = JSON.parse(File.read(downloaded_stats_path))
    stats_array = stats_array.select { |entry| entry.key?("task") }
    pipeline_output_dict = json_dict['pipeline_output']
    pipeline_output_dict.slice!('name', 'total_reads',
                                'remaining_reads', 'taxon_counts_attributes')

    # only keep species level counts
    taxon_counts_attributes_filtered = []
    pipeline_output_dict['taxon_counts_attributes'].each do |tcnt|
      if tcnt['tax_level'].to_i == TaxonCount::TAX_LEVEL_SPECIES
        taxon_counts_attributes_filtered << tcnt
      end
    end

    pipeline_output_dict['taxon_counts_attributes'] = taxon_counts_attributes_filtered
    pipeline_output_dict['job_stats_attributes'] = stats_array
    po = PipelineOutput.new(pipeline_output_dict)
    po.sample = sample
    po.pipeline_run = self
    po.save
    # aggregate the data at genus level
    po.generate_aggregate_counts('genus')
    # merge more accurate name information from lineages table
    po.update_names
    # denormalize genus_taxid and superkingdom_taxid into taxon_counts
    po.update_genera

    self.pipeline_output_id = po.id
    save
    Resque.enqueue(LoadPostprocessFromS3, id)

    # rm the json
    _stdout, _stderr, _status = Open3.capture3("rm -f #{downloaded_json_path} #{downloaded_stats_path}")
    # generate report
    po.generate_report
  end

  def load_postprocess_from_s3
    return if postprocess_status == POSTPROCESS_STATUS_LOADED
    byteranges_json_s3_path = "#{sample.sample_postprocess_s3_path}/#{TAXID_BYTERANGE_JSON_NAME}"
    downloaded_byteranges_path = PipelineRun.download_file(byteranges_json_s3_path, local_json_path)
    return unless downloaded_byteranges_path
    taxon_byteranges_csv_file = "#{local_json_path}/taxon_byteranges"
    hash_array_json2csv(downloaded_byteranges_path, taxon_byteranges_csv_file, %w[taxid hit_type first_byte last_byte])
    ` cd #{local_json_path};
      sed -e 's/$/,#{pipeline_output.id}/' -i taxon_byteranges;
      mysqlimport --replace --local --user=$DB_USERNAME --host=#{rds_host} --password=$DB_PASSWORD --columns=taxid,hit_type,first_byte,last_byte,pipeline_output_id --fields-terminated-by=',' idseq_#{Rails.env} taxon_byteranges;
    `
    self.postprocess_status = POSTPROCESS_STATUS_LOADED
    save
    _stdout, _stderr, _status = Open3.capture3("rm -f #{downloaded_byteranges_path}")
  end

  def self.download_file(s3_path, destination_dir)
    command = "mkdir -p #{destination_dir};"
    command += "aws s3 cp #{s3_path} #{destination_dir}/;"
    _stdout, _stderr, status = Open3.capture3(command)
    return nil unless status.exitstatus.zero?
    "#{destination_dir}/#{File.basename(s3_path)}"
  end

  def file_generated_since_run(s3_path)
    command = "aws s3 ls #{s3_path}"
    stdout, _stderr, status = Open3.capture3(command)
    return false unless status.exitstatus.zero?
    begin
      s3_file_time = DateTime.strptime(stdout[0..18], "%Y-%m-%d %H:%M:%S")
      return (s3_file_time && created_at && s3_file_time > created_at)
    rescue
      return nil
    end
  end

  def terminate_job
    command = "aegea batch terminate #{job_id}"
    _stdout, _stderr, _status = Open3.capture3(command)
  end
end
