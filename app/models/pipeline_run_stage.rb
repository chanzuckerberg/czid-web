class PipelineRunStage < ApplicationRecord
  include ApplicationHelper
  include PipelineOutputsHelper
  belongs_to :pipeline_run

  JOB_TYPE_BATCH = 1
  COMMIT_SHA_FILE_ON_WORKER = "/mnt/idseq-pipeline/commit-sha.txt".freeze

  STATUS_STARTED = 'STARTED'.freeze
  STATUS_FAILED  = 'FAILED'.freeze
  STATUS_CHECKED = 'CHECKED'.freeze
  STATUS_LOADED = 'LOADED'.freeze
  STATUS_ERROR = 'ERROR'.freeze

  # Max number of times we resubmit a job when it gets killed by EC2.
  MAX_RETRIES = 5

  def install_pipeline
    "pip install --upgrade git+git://github.com/chanzuckerberg/s3mi.git; " \
    "cd /mnt; " \
    "git clone https://github.com/chanzuckerberg/idseq-pipeline.git; " \
    "cd idseq-pipeline; " \
    "git checkout #{pipeline_run.pipeline_branch}; " \
    "git rev-parse #{pipeline_run.pipeline_branch} > #{COMMIT_SHA_FILE_ON_WORKER}; " \
    "pip install -e .[test]"
  end

  def aegea_batch_submit_command(base_command, memory = Sample::DEFAULT_MEMORY_IN_MB)
    command = "aegea batch submit --command=\"#{base_command}\" "
    if memory <= Sample::DEFAULT_MEMORY_IN_MB
      vcpus = Sample::DEFAULT_VCPUS
      queue = Sample::DEFAULT_QUEUE
    else
      vcpus = Sample::DEFAULT_VCPUS_HIMEM
      queue = Sample::DEFAULT_QUEUE_HIMEM
    end
    if pipeline_run.sample.job_queue.present?
      if Sample::DEPRECATED_QUEUES.include? pipeline_run.sample.job_queue
        Rails.logger.info "Overriding deprecated queue #{pipeline_run.sample.job_queue} with #{queue}"
      else
        queue = pipeline_run.sample.job_queue
      end
    end
    command += " --storage /mnt=#{Sample::DEFAULT_STORAGE_IN_GB} --ecr-image idseq --memory #{memory} --queue #{queue} --vcpus #{vcpus} --job-role idseq-pipeline "
    command
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

  def checked?
    job_status == STATUS_CHECKED
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
    return if started? && !failed? # job has been started successfully
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
    begin
      send(load_db_command_func)
      update(db_load_status: 1, job_status: STATUS_LOADED)
    rescue
      update(job_status: STATUS_FAILED)
      raise
    ensure
      terminate_job
    end
  end

  def instance_terminated?(job_hash)
    job_hash['status'] == STATUS_FAILED &&
      job_hash['statusReason'].start_with?("Host EC2 (instance") &&
      job_hash['statusReason'].end_with?(") terminated.")
  end

  def add_failed_job
    existing_failed_jobs = failed_jobs ? "#{failed_jobs}, " : ""
    new_failed_job = "[#{job_id}, #{job_log_id}]"
    self.failed_jobs = existing_failed_jobs + new_failed_job
  end

  def count_failed_tries
    return 0 if failed_jobs.blank?
    1 + failed_jobs.count(",")
  end

  def due_for_aegea_check?
    rand < 0.1
  end

  def update_job_status
    if !id || !started? || succeeded? || failed?
      # This is called only from PipelineRun.update_status and only when the guard above is false.
      Airbrake.notify("Invalid precondition for PipelineRunStage.update_job_status #{id} #{job_id} #{job_status}.")
      return
    end
    if checked?
      # This can happen due to overly-eager frequent calls from pipeline_monitor through PipelineRun.update_job_status.
      Rails.logger.info "Job #{id} #{job_id} checked and waiting to load results."
      return
    end
    if output_ready?
      self.job_status = STATUS_CHECKED
      # save before enqueue, to prevent minor race
      save
      Resque.enqueue(LoadResultForRunStage, id)
      return
    end
    # The job appears to be in progress.  Check to make sure it hasn't been killed in AWS.   But not too frequently.
    return unless due_for_aegea_check?
    stdout, stderr, status = Open3.capture3("aegea", "batch", "describe", job_id.to_s)
    unless status.exitstatus.zero?
      Airbrake.notify("Error for update job status for pipeline run #{id} with error #{stderr}")
      self.job_status = STATUS_ERROR # transient error, job is still "in progress"
      self.job_status = STATUS_FAILED if stderr =~ /IndexError/ # job no longer exists
      save
      return
    end
    self.job_description = stdout
    job_hash = JSON.parse(job_description)
    self.job_status = job_hash['status']
    if job_hash['container'] && job_hash['container']['logStreamName']
      self.job_log_id = job_hash['container']['logStreamName']
    end
    unless instance_terminated?(job_hash)
      save
      return
    end
    # note failed attempt and retry
    add_failed_job
    unless count_failed_tries <= MAX_RETRIES
      Airbrake.notify("Job #{job_id} for pipeline run #{id} was killed #{MAX_RETRIES} times.")
      save
      return
    end
    run_job # this saves
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
    memory = sample.sample_memory.present? ? sample.sample_memory : Sample::DEFAULT_MEMORY_IN_MB
    aegea_batch_submit_command(batch_command, memory)
  end

  def alignment_command
    sample = pipeline_run.sample
    file_type = sample.input_files.first.file_type
    batch_command_env_variables = "FASTQ_BUCKET=#{sample.sample_input_s3_path} INPUT_BUCKET=#{sample.sample_output_s3_path} " \
      "OUTPUT_BUCKET=#{pipeline_run.alignment_output_s3_path} FILE_TYPE=#{file_type} ENVIRONMENT=#{Rails.env} DB_SAMPLE_ID=#{sample.id} " \
      "COMMIT_SHA_FILE=#{COMMIT_SHA_FILE_ON_WORKER} SKIP_DEUTERO_FILTER=#{sample.skip_deutero_filter_flag} "
    batch_command_env_variables += "SUBSAMPLE=#{pipeline_run.subsample} " if pipeline_run.subsample
    batch_command = install_pipeline + "; " + batch_command_env_variables + " idseq_pipeline non_host_alignment"
    aegea_batch_submit_command(batch_command)
  end

  def postprocess_command
    batch_command_env_variables = "INPUT_BUCKET=#{pipeline_run.alignment_output_s3_path} " \
      "OUTPUT_BUCKET=#{pipeline_run.postprocess_output_s3_path} " \
      "COMMIT_SHA_FILE=#{COMMIT_SHA_FILE_ON_WORKER} "
    batch_command = install_pipeline + "; " + batch_command_env_variables + " idseq_pipeline postprocess"
    aegea_batch_submit_command(batch_command, Sample::HOST_FILTERING_MEMORY_IN_MB) # HACK: it just needs more vCPUs
  end

  def db_load_host_filtering
    pr = pipeline_run

    stats_json_s3_path = "#{pr.sample_output_s3_path}/#{PipelineRun::STATS_JSON_NAME}"
    downloaded_stats_path = PipelineRun.download_file(stats_json_s3_path, pr.local_json_path)
    stats_array = JSON.parse(File.read(downloaded_stats_path))
    pr.total_reads = (stats_array[0] || {})['total_reads'] || 0
    stats_array = stats_array.select { |entry| entry.key?("task") }

    version_s3_path = "#{pr.sample_output_s3_path}/#{PipelineRun::VERSION_JSON_NAME}"
    pr.version = `aws s3 cp #{version_s3_path} -`

    # TODO(yf): remove the following line
    pr.job_stats_attributes = stats_array

    # rm the json
    _stdout, _stderr, _status = Open3.capture3("rm -f #{downloaded_stats_path}")
  end

  def db_load_alignment
    pr = pipeline_run

    output_json_s3_path = "#{pipeline_run.alignment_output_s3_path}/#{PipelineRun::OUTPUT_JSON_NAME}"
    stats_json_s3_path = "#{pipeline_run.alignment_output_s3_path}/#{PipelineRun::STATS_JSON_NAME}"

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

    version_s3_path = "#{pipeline_run.alignment_output_s3_path}/#{PipelineRun::VERSION_JSON_NAME}"
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
    byteranges_json_s3_path = "#{pipeline_run.postprocess_output_s3_path}/#{PipelineRun::TAXID_BYTERANGE_JSON_NAME}"
    downloaded_byteranges_path = PipelineRun.download_file(byteranges_json_s3_path, pr.local_json_path)
    taxon_byteranges_csv_file = "#{pr.local_json_path}/taxon_byteranges"
    hash_array_json2csv(downloaded_byteranges_path, taxon_byteranges_csv_file, %w[taxid hit_type first_byte last_byte])
    ` cd #{pr.local_json_path};
      sed -e 's/$/,#{pr.id}/' -i taxon_byteranges;
      mysqlimport --replace --local --user=$DB_USERNAME --host=#{rds_host} --password=$DB_PASSWORD --columns=taxid,hit_type,first_byte,last_byte,pipeline_run_id --fields-terminated-by=',' idseq_#{Rails.env} taxon_byteranges;
    `
    _stdout, _stderr, _status = Open3.capture3("rm -f #{downloaded_byteranges_path}")
    pr.notify_users if pr.notify?
  end

  def host_filtering_outputs
    stats_json_s3_path = "#{pipeline_run.sample_output_s3_path}/#{PipelineRun::STATS_JSON_NAME}"
    unmapped_fasta_s3_path = "#{pipeline_run.sample_output_s3_path}/unmapped.bowtie2.lzw.cdhitdup.priceseqfilter.unmapped.star.merged.fasta"
    [stats_json_s3_path, unmapped_fasta_s3_path]
  end

  def alignment_outputs
    stats_json_s3_path = "#{pipeline_run.alignment_output_s3_path}/#{PipelineRun::STATS_JSON_NAME}"
    output_json_s3_path = "#{pipeline_run.alignment_output_s3_path}/#{PipelineRun::OUTPUT_JSON_NAME}"
    [stats_json_s3_path, output_json_s3_path]
  end

  def postprocess_outputs
    ["#{pipeline_run.postprocess_output_s3_path}/#{PipelineRun::TAXID_BYTERANGE_JSON_NAME}"]
  end
end
