class PipelineRunStage < ApplicationRecord
  include ApplicationHelper
  include PipelineOutputsHelper
  belongs_to :pipeline_run

  DEFAULT_MEMORY_IN_MB = 16_000
  DEFAULT_STORAGE_IN_GB = 500
  JOB_TYPE_BATCH = 1
  COMMIT_SHA_FILE_ON_WORKER = "/mnt/idseq-pipeline/commit-sha.txt".freeze

  STATUS_STARTED = 'STARTED'.freeze
  STATUS_FAILED  = 'FAILED'.freeze
  STATUS_CHECKED = 'CHECKED'.freeze
  STATUS_LOADED = 'LOADED'.freeze
  STATUS_ERROR = 'ERROR'.freeze

  before_save :check_job_status

  def install_pipeline
    "cd /mnt; " \
    "git clone https://github.com/chanzuckerberg/idseq-pipeline.git; " \
    "cd idseq-pipeline; " \
    "git checkout charles/subsampling; " \
    "git rev-parse master > #{COMMIT_SHA_FILE_ON_WORKER}; " \
    "pip install -e .[test]"
  end

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

    send(load_db_command_func)
    update(db_load_status: 1, job_status: STATUS_LOADED)
    pipeline_run.update_job_status
  end

  def update_job_status
    return if completed?
    stdout, stderr, status = Open3.capture3("aegea", "batch", "describe", job_id.to_s)
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
    stdout, _stderr, status = Open3.capture3("aws", "s3", "ls", s3_path.to_s)
    return false unless status.exitstatus.zero?
    begin
      s3_file_time = DateTime.strptime(stdout[0..18], "%Y-%m-%d %H:%M:%S")
      return (s3_file_time > created_at)
    rescue
      return nil
    end
  end

  def terminate_job
    _stdout, _stderr, _status = Open3.capture3("aegea", "batch", "terminate", job_id.to_s)
  end

  def sample_output_s3_path
    pipeline_run.sample.sample_output_s3_path
  end

  def postprocess_output_s3_path
    sample = pipeline_run.sample
    pipeline_run.subsample ? "#{sample.sample_postprocess_s3_path}/#{subsample_suffix}" : sample.sample_postprocess_s3_path
  end

  def alignment_output_s3_path
    sample = pipeline_run.sample
    pipeline_run.subsample ? "#{sample.sample_output_s3_path}/#{subsample_suffix}" : sample.sample_output_s3_path
  end

  def subsample_suffix
    "subsample_#{pipeline_run.subsample}"
  end

  def log_url
    return nil unless job_log_id
    "https://us-west-2.console.aws.amazon.com/cloudwatch/home?region=us-west-2" \
      "#logEventViewer:group=/aws/batch/job;stream=#{job_log_id}"
  end

  ########### STAGE SPECIFIC FUNCTIONS BELOW ############

  def host_filtering_command
    sample = pipeline_run.sample
    file_type = sample.input_files.first.file_type
    batch_command_env_variables = "INPUT_BUCKET=#{sample.sample_input_s3_path} OUTPUT_BUCKET=#{sample.sample_output_s3_path} " \
      "FILE_TYPE=#{file_type} DB_SAMPLE_ID=#{sample.id} " \
      "COMMIT_SHA_FILE=#{COMMIT_SHA_FILE_ON_WORKER} "
    if sample.s3_star_index_path.present?
      batch_command_env_variables += " STAR_GENOME=#{sample.s3_star_index_path} "
    end
    if sample.s3_bowtie2_index_path.present?
      batch_command_env_variables += " BOWTIE2_GENOME=#{sample.s3_bowtie2_index_path} "
    end
    batch_command = install_pipeline + "; " + batch_command_env_variables + " idseq_pipeline host_filtering"
    command = "aegea batch submit --command=\"#{batch_command}\" "
    memory = sample.sample_memory.present? ? sample.sample_memory : Sample::DEFAULT_MEMORY
    queue =  sample.job_queue.present? ? sample.job_queue : Sample::DEFAULT_QUEUE
    command += " --storage /mnt=#{DEFAULT_STORAGE_IN_GB} --ecr-image idseq --memory #{memory} --queue #{queue} --vcpus 4"
    command
  end

  def alignment_command
    sample = pipeline_run.sample
    file_type = sample.input_files.first.file_type
    batch_command_env_variables = "FASTQ_BUCKET=#{sample.sample_input_s3_path} INPUT_BUCKET=#{sample.sample_output_s3_path} " \
      "OUTPUT_BUCKET=#{alignment_output_s3_path} FILE_TYPE=#{file_type} ENVIRONMENT=#{Rails.env} DB_SAMPLE_ID=#{sample.id} " \
      "COMMIT_SHA_FILE=#{COMMIT_SHA_FILE_ON_WORKER} "
    batch_command_env_variables += "SUBSAMPLE=#{pipeline_run.subsample} " if pipeline_run.subsample
    batch_command = install_pipeline + "; " + batch_command_env_variables + " idseq_pipeline non_host_alignment"
    command = "aegea batch submit --command=\"#{batch_command}\" "
    queue = sample.job_queue.present? ? sample.job_queue : Sample::DEFAULT_QUEUE
    command += " --storage /mnt=#{DEFAULT_STORAGE_IN_GB} --ecr-image idseq --memory #{DEFAULT_MEMORY_IN_MB} --queue #{queue} --vcpus 4"
    command
  end

  def postprocess_command
    sample = pipeline_run.sample
    batch_command_env_variables = "INPUT_BUCKET=#{alignment_output_s3_path} " \
      "OUTPUT_BUCKET=#{postprocess_output_s3_path} " \
      "COMMIT_SHA_FILE=#{COMMIT_SHA_FILE_ON_WORKER} "
    batch_command = install_pipeline + "; " + batch_command_env_variables + " idseq_pipeline postprocess"
    command = "aegea batch submit --command=\"#{batch_command}\" "
    queue = sample.job_queue.present? ? sample.job_queue : Sample::DEFAULT_QUEUE
    command += " --storage /mnt=#{DEFAULT_STORAGE_IN_GB} --ecr-image idseq --memory #{DEFAULT_MEMORY_IN_MB} --queue #{queue} --vcpus 4"
    command
  end

  def db_load_host_filtering
    pr = pipeline_run

    stats_json_s3_path = "#{sample_output_s3_path}/#{PipelineRun::STATS_JSON_NAME}"
    downloaded_stats_path = PipelineRun.download_file(stats_json_s3_path, pr.local_json_path)
    stats_array = JSON.parse(File.read(downloaded_stats_path))
    pr.total_reads = (stats_array[0] || {})['total_reads'] || 0
    stats_array = stats_array.select { |entry| entry.key?("task") }

    version_s3_path = "#{sample_output_s3_path}/#{PipelineRun::VERSION_JSON_NAME}"
    pr.version = `aws s3 cp #{version_s3_path} -`

    # TODO(yf): remove the following line
    pr.job_stats_attributes = stats_array

    # rm the json
    _stdout, _stderr, _status = Open3.capture3("rm -f #{downloaded_stats_path}")
  end

  def db_load_alignment
    pr = pipeline_run

    output_json_s3_path = "#{alignment_output_s3_path}/#{PipelineRun::OUTPUT_JSON_NAME}"
    stats_json_s3_path = "#{alignment_output_s3_path}/#{PipelineRun::STATS_JSON_NAME}"

    # Get the file
    downloaded_json_path = PipelineRun.download_file(output_json_s3_path, pr.local_json_path)
    downloaded_stats_path = PipelineRun.download_file(stats_json_s3_path, pr.local_json_path)
    return unless downloaded_json_path && downloaded_stats_path
    json_dict = JSON.parse(File.read(downloaded_json_path))

    pipeline_output_dict = json_dict['pipeline_output']
    pipeline_output_dict.slice!('remaining_reads', 'total_reads', 'taxon_counts_attributes')

    pr.total_reads = pipeline_output_dict['total_reads']
    pr.remaining_reads = pipeline_output_dict['remaining_reads']
    pr.unmapped_reads = pr.count_unmapped_reads

    stats_array = JSON.parse(File.read(downloaded_stats_path))
    stats_array = stats_array.select { |entry| entry.key?("task") }

    version_s3_path = "#{alignment_output_s3_path}/#{PipelineRun::VERSION_JSON_NAME}"
    pr.version = `aws s3 cp #{version_s3_path} -`

    # only keep species level counts
    taxon_counts_attributes_filtered = []
    pipeline_output_dict['taxon_counts_attributes'].each do |tcnt|
      if tcnt['tax_level'].to_i == TaxonCount::TAX_LEVEL_SPECIES
        taxon_counts_attributes_filtered << tcnt
      end
    end

    pr.job_stats.delete_all
    pr.job_stats_attributes = stats_array
    pr.taxon_counts_attributes = taxon_counts_attributes_filtered
    pr.updated_at = Time.now.utc
    pr.save
    # aggregate the data at genus level
    pr.generate_aggregate_counts('genus')
    # merge more accurate name information from lineages table
    pr.update_names
    # denormalize genus_taxid and superkingdom_taxid into taxon_counts
    pr.update_genera

    # rm the json
    _stdout, _stderr, _status = Open3.capture3("rm -f #{downloaded_json_path} #{downloaded_stats_path}")
  end

  def db_load_postprocess
    pr = pipeline_run
    byteranges_json_s3_path = "#{postprocess_output_s3_path}/#{PipelineRun::TAXID_BYTERANGE_JSON_NAME}"
    downloaded_byteranges_path = PipelineRun.download_file(byteranges_json_s3_path, pr.local_json_path)
    taxon_byteranges_csv_file = "#{pr.local_json_path}/taxon_byteranges"
    hash_array_json2csv(downloaded_byteranges_path, taxon_byteranges_csv_file, %w[taxid hit_type first_byte last_byte])
    ` cd #{pr.local_json_path};
      sed -e 's/$/,#{pr.id}/' -i taxon_byteranges;
      mysqlimport --replace --local --user=$DB_USERNAME --host=#{rds_host} --password=$DB_PASSWORD --columns=taxid,hit_type,first_byte,last_byte,pipeline_run_id --fields-terminated-by=',' idseq_#{Rails.env} taxon_byteranges;
    `
    _stdout, _stderr, _status = Open3.capture3("rm -f #{downloaded_byteranges_path}")
  end

  def host_filtering_outputs
    stats_json_s3_path = "#{sample_output_s3_path}/#{PipelineRun::STATS_JSON_NAME}"
    unmapped_fasta_s3_path = "#{sample_output_s3_path}/unmapped.bowtie2.lzw.cdhitdup.priceseqfilter.unmapped.star.merged.fasta"
    [stats_json_s3_path, unmapped_fasta_s3_path]
  end

  def alignment_outputs
    stats_json_s3_path = "#{alignment_output_s3_path}/#{PipelineRun::STATS_JSON_NAME}"
    output_json_s3_path = "#{alignment_output_s3_path}/#{PipelineRun::OUTPUT_JSON_NAME}"
    [stats_json_s3_path, output_json_s3_path]
  end

  def postprocess_outputs
    ["#{postprocess_output_s3_path}/#{PipelineRun::TAXID_BYTERANGE_JSON_NAME}"]
  end
end
