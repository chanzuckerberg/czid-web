class PipelineRunStage < ApplicationRecord
  include ApplicationHelper
  belongs_to :pipeline_run
  DEFAULT_MEMORY_IN_MB = 4000
  DEFAULT_STORAGE_IN_GB = 500
  JOB_TYPE_BATCH = 1

  STATUS_STARTED = 'STARTED'.freeze
  STATUS_FAILED  = 'FAILED'.freeze
  STATUS_CHECKED = 'CHECKED'.freeze

  before_save :check_job_status

  def check_job_status
    return if completed? || !started? || !id
    if output_ready?
      self.job_status = STATUS_CHECKED
      Resque.enqueue(LoadResultForRunStage, id)
      terminate_job
    end
  end

  def started?
    job_command.present?
  end

  def failed?
    job_status == STATUS_FAILED
  end

  def succeeded? # The whole thing completed successfully
    db_load_status == 1
  end

  def completed?
    failed? || succeeded?
  end

  def output_ready?
    s3_output_list = send(output_func)
    s3_output_list.each do |out_f|
      return false unless file_generated_since_run(out_f)
    end
    true
  end

  def run_job
    # Check output for the run and decide if we should run this stage
    return if job_command.present? && job_status != 'FAILED' # job has been started successfully
    self.job_command = send(job_command_func)
    self.command_stdout, self.command_stderr, status = Open3.capture3(job_command)
    if status.exitstatus.zero?
      output = JSON.parse(command_stdout)
      self.job_id = output['jobId']
      self.job_status = STATUS_STARTED
    else
      self.job_status = STATUS_FAILED
    end
    self.created_at = Time.now.utc
    save
  end

  def run_load_db
    return unless output_ready?
    return if completed?

    set_pipeline_output
    send(load_db_command_func)
    update(db_load_status: 1)
    pipeline_run.update_job_status
  end

  def update_job_status
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

  def file_generated_since_run(s3_path)
    command = "aws s3 ls #{s3_path}"
    stdout, _stderr, status = Open3.capture3(command)
    return false unless status.exitstatus.zero?
    begin
      s3_file_time = DateTime.strptime(stdout[0..18], "%Y-%m-%d %H:%M:%S")
      return (s3_file_time > created_at)
    rescue
      return nil
    end
  end

  def terminate_job
    command = "aegea batch terminate #{job_id}"
    _stdout, _stderr, _status = Open3.capture3(command)
  end

  def set_pipeline_output
    return if pipeline_run.pipeline_output
    pipeline_run.pipeline_output = PipelineOutput.new(pipeline_run: pipeline_run,
                                                      sample: pipeline_run.sample,
                                                      total_reads: 0,
                                                      remaining_reads: 0)
  end

  def sample_output_s3_path
    pipeline_run.sample.sample_output_s3_path
  end

  def log_url
    return nil unless job_log_id
    "https://us-west-2.console.aws.amazon.com/cloudwatch/home?region=us-west-2" \
      "#logEventViewer:group=/aws/batch/job;stream=#{job_log_id}"
  end

  ########### STAGE SPECIFIC FUNCTIONS BELOW ############

  def host_filtering_command
    script_name = File.basename(IdSeqPipeline::S3_HOST_FILTER_SCRIPT_LOC)
    sample = pipeline_run.sample
    file_type = sample.input_files.first.file_type
    batch_command_env_variables = "INPUT_BUCKET=#{sample.sample_input_s3_path} OUTPUT_BUCKET=#{sample.sample_output_s3_path} " \
      "FILE_TYPE=#{file_type} ENVIRONMENT=#{Rails.env} DB_SAMPLE_ID=#{sample.id}"
    if sample.s3_star_index_path.present?
      batch_command_env_variables += "STAR_GENOME=#{sample.s3_star_index_path} "
    end
    if sample.s3_bowtie2_index_path.present?
      batch_command_env_variables += "BOWTIE2_GENOME=#{sample.s3_bowtie2_index_path} "
    end
    batch_command = "aws s3 cp #{IdSeqPipeline::S3_HOST_FILTER_SCRIPT_LOC} .; chmod 755 #{script_name}; " +
                    batch_command_env_variables + " ./#{script_name}"
    command = "aegea batch submit --command=\"#{batch_command}\" "
    memory = sample.sample_memory.present? ? sample.sample_memory : Sample::DEFAULT_MEMORY
    queue =  sample.job_queue.present? ? sample.job_queue : Sample::DEFAULT_QUEUE
    command += " --storage /mnt=#{DEFAULT_STORAGE_IN_GB} --ecr-image idseq --memory #{memory} --queue #{queue} --vcpus 4"
    command
  end

  def alignment_command
    script_name = File.basename(IdSeqPipeline::S3_ALIGNMENT_SCRIPT_LOC)
    sample = pipeline_run.sample
    batch_command_env_variables = "INPUT_BUCKET=#{sample.sample_input_s3_path} OUTPUT_BUCKET=#{sample.sample_output_s3_path} " \
      "ENVIRONMENT=#{Rails.env} DB_SAMPLE_ID=#{sample.id}"
    batch_command = "aws s3 cp #{IdSeqPipeline::S3_ALIGNMENT_SCRIPT_LOC} .; chmod 755 #{script_name}; " +
                    batch_command_env_variables + " ./#{script_name}"
    command = "aegea batch submit --command=\"#{batch_command}\" "
    queue = sample.job_queue.present? ? sample.job_queue : Sample::DEFAULT_QUEUE
    command += " --storage /mnt=#{DEFAULT_STORAGE_IN_GB} --ecr-image idseq --memory #{DEFAULT_MEMORY_IN_MB} --queue #{queue} --vcpus 4"
    command
  end

  def postprocess_command
    script_name = File.basename(IdSeqPipeline::S3_POSTPROCESS_SCRIPT_LOC)
    sample = pipeline_run.sample
    batch_command_env_variables = "INPUT_BUCKET=#{sample.sample_output_s3_path} " \
      "OUTPUT_BUCKET=#{sample.sample_postprocess_s3_path} "
    batch_command = "aws s3 cp #{IdSeqPipeline::S3_POSTPROCESS_SCRIPT_LOC} .; chmod 755 #{script_name}; " +
                    batch_command_env_variables + " ./#{script_name}"
    command = "aegea batch submit --command=\"#{batch_command}\" "
    queue = sample.job_queue.present? ? sample.job_queue : Sample::DEFAULT_QUEUE
    command += " --storage /mnt=#{DEFAULT_STORAGE_IN_GB} --ecr-image idseq --memory #{DEFAULT_MEMORY_IN_MB} --queue #{queue} --vcpus 4"
    command
  end

  def db_load_host_filtering
    po = pipeline_run.pipeline_output
    pr = pipeline_run

    stats_json_s3_path = "#{sample_output_s3_path}/#{PipelineRun::STATS_JSON_NAME}"
    downloaded_stats_path = PipelineRun.download_file(stats_json_s3_path, pr.local_json_path)
    stats_array = JSON.parse(File.read(downloaded_stats_path))
    po.total_reads = (stats_array[0] || {})['total_reads'] || 0

    stats_array = stats_array.select { |entry| entry.key?("task") }
    po.job_stats_attributes = stats_array
    po.save
    # rm the json
    _stdout, _stderr, _status = Open3.capture3("rm -f #{downloaded_stats_path}")
  end

  def db_load_alignment
    po = pipeline_run.pipeline_output
    pr = pipeline_run

    output_json_s3_path = "#{sample_output_s3_path}/#{PipelineRun::OUTPUT_JSON_NAME}"
    stats_json_s3_path = "#{sample_output_s3_path}/#{PipelineRun::STATS_JSON_NAME}"

    # Get the file
    downloaded_json_path = PipelineRun.download_file(output_json_s3_path, pr.local_json_path)
    downloaded_stats_path = PipelineRun.download_file(stats_json_s3_path, pr.local_json_path)
    return unless downloaded_json_path && downloaded_stats_path
    json_dict = JSON.parse(File.read(downloaded_json_path))
    stats_array = JSON.parse(File.read(downloaded_stats_path))
    stats_array = stats_array.select { |entry| entry.key?("task") }

    pipeline_output_dict = json_dict['pipeline_output']
    pipeline_output_dict.slice!('remaining_reads', 'total_reads', 'taxon_counts_attributes')
    po.total_reads = pipeline_output_dict['total_reads']
    po.remaining_reads = pipeline_output_dict['remaining_reads']

    # only keep species level counts
    taxon_counts_attributes_filtered = []
    pipeline_output_dict['taxon_counts_attributes'].each do |tcnt|
      if tcnt['tax_level'].to_i == TaxonCount::TAX_LEVEL_SPECIES
        taxon_counts_attributes_filtered << tcnt
      end
    end

    po.job_stats.delete_all
    po.job_stats_attributes = stats_array
    po.taxon_counts_attributes = taxon_counts_attributes_filtered
    po.save
    # aggregate the data at genus level
    po.generate_aggregate_counts('genus')
    # merge more accurate name information from lineages table
    po.update_names
    # denormalize genus_taxid and superkingdom_taxid into taxon_counts
    po.update_genera
    # generate report
    po.generate_report

    # rm the json
    _stdout, _stderr, _status = Open3.capture3("rm -f #{downloaded_json_path} #{downloaded_stats_path}")
  end

  def db_load_postprocess
    po = pipeline_run.pipeline_output
    pr = pipeline_run
    byteranges_json_s3_path = "#{pr.sample.sample_postprocess_s3_path}/#{PipelineRun::TAXID_BYTERANGE_JSON_NAME}"
    downloaded_byteranges_path = PipelineRun.download_file(byteranges_json_s3_path, pr.local_json_path)
    taxon_byteranges_csv_file = "#{pr.local_json_path}/taxon_byteranges"
    hash_array_json2csv(downloaded_byteranges_path, taxon_byteranges_csv_file, %w[taxid hit_type first_byte last_byte])
    ` cd #{pr.local_json_path};
      sed -e 's/$/,#{po.id}/' -i taxon_byteranges;
      mysqlimport --replace --local --user=$DB_USERNAME --host=#{rds_host} --password=$DB_PASSWORD --columns=taxid,hit_type,first_byte,last_byte,pipeline_output_id --fields-terminated-by=',' idseq_#{Rails.env} taxon_byteranges;
    `
    po.save
    _stdout, _stderr, _status = Open3.capture3("rm -f #{downloaded_byteranges_path}")
  end

  def host_filtering_outputs
    stats_json_s3_path = "#{sample_output_s3_path}/#{PipelineRun::STATS_JSON_NAME}"
    unmapped_fasta_s3_path = "#{sample_output_s3_path}/unmapped.bowtie2.lzw.cdhitdup.priceseqfilter.unmapped.star.merged.fasta"
    [stats_json_s3_path, unmapped_fasta_s3_path]
  end

  def alignment_outputs
    stats_json_s3_path = "#{sample_output_s3_path}/#{PipelineRun::STATS_JSON_NAME}"
    output_json_s3_path = "#{sample_output_s3_path}/#{PipelineRun::OUTPUT_JSON_NAME}"
    [stats_json_s3_path, output_json_s3_path]
  end

  def postprocess_outputs
    ["#{pipeline_run.sample.sample_postprocess_s3_path}/#{PipelineRun::TAXID_BYTERANGE_JSON_NAME}"]
  end
end
