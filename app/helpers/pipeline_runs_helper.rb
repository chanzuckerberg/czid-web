require 'open3'
require 'shellwords'
require 'yaml'

module PipelineRunsHelper
  STEP_DESCRIPTIONS = {
    PipelineRunStage::HOST_FILTERING_STAGE_NAME => {
      "stage" => "Filter out host reads and conduct quality control.",
      "steps" => {
        "validate_input_out" => "Validates input files are .fastq format; truncates to 75 million fragments",
        "bowtie2_ercc_filtered_out" => "Removes ERCCs",
        "fastp_out" => "Removes low quality bases, short reads, and low complexity reads",
        "kallisto" => "Generates host transcript counts",
        "bowtie2_host_filtered_out" => "Implements primary step for subtracting host reads",
        "hisat2_host_filtered_out" => "Removes remaining host reads",
        "insert_size_metrics" => "Generates insert size metrics",
        "bowtie2_human_filtered_out" => "If not a human host, remove human reads using Bowtie2",
        "hisat2_human_filtered_out" => "If not a human host, remove remaining human reads",
        "star_out" => "Implements step for Host Subtraction",
        "trimmomatic_out" => "Removes adapter sequences",
        "priceseq_out" => "Removes low-quality reads",
        # "cdhitdup_out" required for backwards compatibility
        "cdhitdup_out" => "Identifies and collapses duplicate reads",
        # "idseq_dedup_out" required for backwards compatibiility
        "idseq_dedup_out" => "Identifies and collapses duplicate reads",
        "czid_dedup_out" => "Identifies and collapses duplicate reads",
        "lzw_out" => "Removes low-complexity reads",
        "bowtie2_out" => "Removes remaining host reads",
        "star_human_out" => "Remove human reads using STAR",
        "bowtie2_human_out" => "Remove residual human reads using Bowtie2",
        "subsampled_out" => "Randomly subsamples 1 million fragments",
        "gsnap_filter_out" => "Removes all potentially-human sequences",
      },
      # For steps where capitalization matters, override the DAG name (e.g. "star_out" becomes "STAR" instead of "Star")
      "step_names" => {
        "star_out" => "STAR",
        "idseq_dedup_out" => "CZID-dedup",
        "czid_dedup_out" => "CZID-dedup",
        "lzw_out" => "LZW",
        "bowtie2_out" => "Bowtie2",
        "star_human_out" => "STAR",
        "bowtie2_human_out" => "Bowtie2",
        "gsnap_filter_out" => "GSNAP",
      },
    },
    PipelineRunStage::ALIGNMENT_STAGE_NAME => {
      "stage" => "Align reads to NCBI nucleotide and protein databases.",
      "steps" => {
        "gsnap_out" => "Align remaining reads to the NCBI NT database using GSNAP.",
        "minimap2_out" => "Align remaining reads to the NCBI NT database using minimap2",
        "minimap2_call_hits_out" => "Assign accessions from minimap2 to taxon",
        "rapsearch2_out" => "Align remaining reads to the NCBI NR database using RAPSearch2.",
        "diamond_out" => "Align remaining reads to the NCBI NR database using diamond",
        "diamond_call_hits_out" => "Assign accessions from diamond to taxon",
        "taxon_count_out" => "Count preliminary taxon hits.",
        "annotated_out" => "Annotate non-host FASTA with preliminary NCBI accession IDs.",
      },
    },
    PipelineRunStage::OLD_ALIGNMENT_STAGE_NAME => {
      "stage" => "Align reads to NCBI nucleotide and protein databases.",
      "steps" => {
        "gsnap_out" => "Align remaining reads to the NCBI NT database using GSNAP.",
        "rapsearch2_out" => "Align remaining reads to the NCBI NR database using RAPSearch2.",
        "taxon_count_out" => "Count preliminary taxon hits.",
        "annotated_out" => "Annotate non-host FASTA with preliminary NCBI accession IDs.",
      },
    },
    PipelineRunStage::POSTPROCESS_STAGE_NAME => {
      "stage" => "Assemble reads and refine read assignments.",
      "steps" => {
        "taxid_fasta_out" => "Annotate non-host FASTA with preliminary Taxonomy IDs.",
        "taxid_locator_out" => "Sort preliminary annotated FASTA by Taxonomy IDs and store the byte range of each Taxonomy ID in a JSON.",
        "alignment_viz_out" => "Record number of unique accessions matched.",
        "assembly_out" => "Assemble non-host reads using SPAdes.",
        "coverage_out" => "Calculate coverage statistics for assembled contigs",
        "gsnap_accessions_out" => "Generate FASTA of candidate references matched during GSNAP / NT alignment.",
        "rapsearch2_accessions_out" => "Generate FASTA of candidate references matched during RAPSearch2 / NR alignment.",
        "refined_gsnap_out" => "BLAST assembled contigs against candidate references from NT; reassign corresponding reads to the matched taxon.",
        "refined_rapsearch2_out" => "BLAST assembled contigs against candidate references from NR; reassign corresponding reads to the matched taxon.",
        "refined_taxon_count_out" => "Count taxon hits after the reassignment based on the BLAST results.",
        "contig_summary_out" => "Record statistics on the assembled contigs.",
        "refined_annotated_out" => "Annotate non-host FASTA with NCBI accession IDs after the BLAST-based match refinement.",
        "refined_taxid_locator_out" => "Annotate non-host FASTA with revised Taxonomy IDs after the BLAST-based match refinement.",
      },
    },
    PipelineRunStage::EXPT_STAGE_NAME => {
      "stage" => "Generate additional experimental output.",
      "steps" => {
        "nonhost_fastq_out" => "Filter original fastq/fasta input files to only contain non-host reads processed by CZ ID.",
      },
    },
  }.freeze
  ALL_STEP_NAMES = STEP_DESCRIPTIONS.values.map { |stage| stage["steps"].keys }.flatten

  PIPELINE_RUN_STILL_RUNNING_ERROR = "PIPELINE_RUN_STILL_RUNNING_ERROR".freeze
  PIPELINE_RUN_FAILED_ERROR = "PIPELINE_RUN_FAILED_ERROR".freeze

  def aegea_batch_submit_command(base_command,
                                 memory: Sample::DEFAULT_MEMORY_IN_MB,
                                 vcpus: Sample::DEFAULT_VCPUS,
                                 job_queue: Sample::DEFAULT_QUEUE,
                                 docker_image: "idseq_dag",
                                 sample_id: 0,
                                 stage_name: "misc")
    # TODO: https://jira.czi.team/browse/IDSEQ-2647
    #   environment values once we use the new pipeline infra
    #   that new infra uses dev rather than development
    #   once we switch to that for the pipeline these values won't be needed
    deployment_environment = SfnPipelineDispatchService::ENV_TO_DEPLOYMENT_STAGE_NAMES[Rails.env]
    command = "aegea batch submit --command=#{Shellwords.escape(base_command)} "
    command += " --name=idseq-#{Rails.env}-#{sample_id}-#{stage_name} "
    command += " --ecr-image #{Shellwords.escape(docker_image)} --memory #{memory} --queue #{Shellwords.escape(job_queue)} --vcpus #{vcpus} --job-role idseq-pipeline "
    command += " --mount-instance-storage "
    command += " --environment DEPLOYMENT_ENVIRONMENT=#{deployment_environment} PROVISIONING_MODEL=EC2 PRIORITY_NAME=normal "
    command
  end

  def job_info(job_id, run_id)
    job_status = nil
    job_log_id = nil
    job_hash = nil
    stdout, stderr, status = Open3.capture3("aegea", "batch", "describe", job_id.to_s)
    if status.exitstatus.zero?
      job_description = stdout
      job_hash = JSON.parse(job_description)
      job_status = job_hash['status']
      if job_hash['container'] && job_hash['container']['logStreamName']
        job_log_id = job_hash['container']['logStreamName']
      end
    else
      LogUtil.log_error(
        "Error for update job status for record #{run_id} with error #{stderr}",
        job_id: job_id,
        run_id: run_id
      )
      job_status = PipelineRunStage::STATUS_ERROR # transient error, job is still "in progress"
      job_status = PipelineRunStage::STATUS_FAILED if stderr =~ /IndexError/ # job no longer exists
    end
    [job_status, job_log_id, stdout]
  end

  def sfn_info(sfn_execution_arn, run_id, stage_number)
    job_status = nil
    job_log_id = nil
    stdout, stderr, status =
      Open3.capture3(
        "aws", "stepfunctions", "get-execution-history",
        "--output", "json", "--execution-arn", sfn_execution_arn
      )
    if status.exitstatus.zero?
      sfn_execution_history_hash = JSON.parse(stdout)
      sfn_hash = parse_sfn_execution_history_hash(sfn_execution_history_hash)
      job_status = sfn_hash.dig(stage_number.to_s, "status") || "PENDING"
    else
      LogUtil.log_error(
        "Error for update sfn status for record #{run_id} - stage #{stage_number} with error #{stderr}",
        sfn_execution_arn: sfn_execution_arn,
        run_id: run_id,
        stage_number: stage_number
      )
      job_status = PipelineRunStage::STATUS_ERROR # transient error, job is still "in progress"
      if stderr =~ /ExecutionDoesNotExist/ || stderr =~ /InvalidArn/
        # job no longer exists or ARN is invalid
        job_status = PipelineRunStage::STATUS_FAILED
      end
    end
    [job_status, job_log_id]
  end

  def parse_sfn_execution_history_hash(sfn_execution_history_hash)
    failed_types = %w[ExecutionAborted ExecutionFailed ExecutionTimedOut]
    failed_state =
      sfn_execution_history_hash["events"]
      .find { |evt| failed_types.include?(evt["type"]) }

    step_numbers = {
      "HostFilter" => 1,
      "NonHostAlignment" => 2,
      "Postprocess" => 3,
      "Experimental" => 4,
    }
    name_regexp = /\A(#{step_numbers.keys.join("|")})(SPOT|EC2|Succeeded|Failed)\Z/
    result =
      sfn_execution_history_hash["events"]
      .select { |evt| evt["type"] =~ /^TaskState|PassState/ }
      .map do |evt|
        details_key = evt.keys.find { |k| k =~ /EventDetails$/ }
        {
          "type" => evt["type"].gsub(/^(Pass|Task)State/, ""),
          "name" => evt.dig(details_key, "name"),
        }
      end
      .select { |evt| evt["name"].match?(name_regexp) }
      .map do |evt|
        stage, task = evt["name"].match(name_regexp)[1..2]
        { "stage" => stage, "task" => task, "type" => evt["type"] }
      end
      .each_with_object({}) do |evt, acc|
        stage, task, evt_type = evt.values_at("stage", "task", "type")
        evt_obj = acc[stage] ||= evt.slice("stage")
        task_obj = evt_obj[task] ||= {}
        task_obj[evt_type] = true
      end
      .values
      .map do |evt|
        stage = evt["stage"]
        started = evt.dig("SPOT", "Entered") || evt.dig("EC2", "Entered") || evt.dig("Succeeded", "Entered") || false
        completed = evt.dig("Succeeded", "Exited") || false
        # I'm not using declared constants here because I'm emulating aws batch job `status` field
        # trying to mimic output behavior of PipelineRunsHelper#job_info
        # the domain for a job `status` field is SUBMITTED,PENDING,RUNNABLE,STARTING,RUNNING,SUCCEEDED,FAILED
        status = if started && completed
                   "SUCCEEDED"
                 elsif started && !completed && !failed_state
                   "RUNNING"
                 elsif failed_state
                   "FAILED"
                 else
                   "PENDING"
                 end
        [step_numbers[stage].to_s, { "stage" => stage, "status" => status }]
      end
      .to_h

    if failed_state && !result["1"]
      # special case when step function is aborted before stage 1
      { "1" => { "stage" => "HostFilter", "status" => "FAILED" } }
    else
      result
    end
  end

  def file_generated_since_run(record, s3_path)
    stdout, _stderr, status = Open3.capture3("aws", "s3", "ls", s3_path.to_s)
    return false unless status.exitstatus.zero?

    begin
      s3_file_time = Time.strptime(stdout[0..18], "%Y-%m-%d %H:%M:%S")
      return (s3_file_time && record.created_at && s3_file_time > record.created_at)
    rescue StandardError
      return nil
    end
  end

  def update_pipeline_version(record, version_column, s3_version_file)
    if record[version_column].blank? && file_generated_since_run(record, s3_version_file)
      record[version_column] = fetch_pipeline_version(s3_version_file)
      record.save
    end
  end

  def fetch_pipeline_version(s3_file = pipeline_version_file)
    u = URI(s3_file)
    u.path.slice!(0)
    begin
      resp = S3_CLIENT.get_object(bucket: u.host, key: u.path)
      whole_version = resp.body.read
      whole_version = whole_version.strip
      whole_version =~ /(^\d+\.\d+).*/
      # since we are externally managing the pipeline version for the phylo tree it's
      #   version is `EXTERNALLY_MANAGED` this doesn't match the regex but we still
      #   want to use it for results paths. This function will fall back to the full
      #   string for the version if the pattern doesn't match to handle this case.
      Regexp.last_match(1) || whole_version
    rescue Aws::S3::Errors::ServiceError => e
      Rails.logger.error("Failed to get pipeline version at #{s3_file}. Error: #{e}")
      return nil
    end
  end

  def upload_dag_json_and_return_job_command(dag_json, dag_s3, dag_name, key_s3_params = nil, copy_done_file = "")
    upload_dag_json(dag_json, dag_s3)
    generate_job_command(dag_s3, dag_name, key_s3_params, copy_done_file)
  end

  def upload_dag_json(dag_json, dag_s3)
    # Upload dag json
    Syscall.pipe_with_output(["echo", dag_json], ["aws", "s3", "cp", "-", dag_s3])
  end

  def generate_job_command(dag_s3, dag_name, key_s3_params = nil, copy_done_file = "")
    # Generate job command
    dag_path_on_worker = "/mnt/#{dag_name}.json"
    download_dag = "aws s3 cp #{dag_s3} #{dag_path_on_worker}"
    execute_dag = "idseq_dag #{key_s3_params} #{dag_path_on_worker}"
    [download_dag, execute_dag, copy_done_file].join(";")
  end

  def install_pipeline(commit_or_branch)
    "pip install --upgrade git+git://github.com/chanzuckerberg/s3mi.git; " \
    "cd /mnt; rm -rf idseq-workflows idseq/results; df -h; " \
    "git clone https://github.com/chanzuckerberg/idseq-workflows.git; " \
    "cd idseq-workflows/short-read-mngs/idseq-dag; " \
    "git checkout #{Shellwords.escape(commit_or_branch)}; " \
    "pip3 install -e ."
  end

  def upload_version(s3_file)
    "idseq_dag --version | cut -f2 -d ' ' | aws s3 cp  - #{Shellwords.escape(s3_file)}"
  end

  def download_to_filename?(s3_file, local_file)
    # downloads file and returns whether it was successful
    Open3.capture3("aws", "s3", "cp", s3_file, local_file)[2].success?
  end

  def exists_in_s3?(s3_path)
    Open3.capture3("aws", "s3", "ls", s3_path)[2].success?
  end

  PIPELINE_VERSION_2 = '2.0'.freeze
  ASSEMBLY_PIPELINE_VERSION = '3.1'.freeze
  COVERAGE_VIZ_PIPELINE_VERSION = '3.6'.freeze
  NEW_HOST_FILTERING_PIPELINE_VERSION = '8'.freeze
  BOWTIE2_ERCC_READS_PIPELINE_VERSION = "8.1".freeze
  BOWTIE2_ERCC_READS_BEFORE_QUALITY_FILTERING_PIPELINE_VERSION = "8.2".freeze

  def pipeline_version_at_least(pipeline_version, test_version)
    unless pipeline_version
      return false
    end

    pipeline_nums = pipeline_version.split(".")
    test_nums = test_version.split(".")

    # nil.to_i = 0, so we don't need to special-case versions like 3 and 3.1.
    if pipeline_nums[0].to_i > test_nums[0].to_i
      return true
    elsif pipeline_nums[0].to_i == test_nums[0].to_i
      if pipeline_nums[1].to_i > test_nums[1].to_i
        return true
      elsif pipeline_nums[1].to_i == test_nums[1].to_i
        if pipeline_nums[2].to_i >= test_nums[2].to_i
          return true
        end
      end
    end

    return false
  end

  def pipeline_version_uses_new_host_filtering_stage(pipeline_version)
    pipeline_version_at_least(pipeline_version, NEW_HOST_FILTERING_PIPELINE_VERSION)
  end

  def pipeline_version_uses_bowtie2_to_calculate_ercc_reads(pipeline_version)
    pipeline_version_at_least(pipeline_version, BOWTIE2_ERCC_READS_PIPELINE_VERSION)
  end

  def pipeline_version_calculates_erccs_before_quality_filtering(pipeline_version)
    pipeline_version_at_least(pipeline_version, BOWTIE2_ERCC_READS_BEFORE_QUALITY_FILTERING_PIPELINE_VERSION)
  end

  def pipeline_version_has_assembly(pipeline_version)
    pipeline_version_at_least(pipeline_version, ASSEMBLY_PIPELINE_VERSION)
  end

  def pipeline_version_has_coverage_viz(pipeline_version)
    pipeline_version_at_least(pipeline_version, COVERAGE_VIZ_PIPELINE_VERSION)
  end

  def pipeline_version_at_least_2(pipeline_version)
    pipeline_version_at_least(pipeline_version, PIPELINE_VERSION_2)
  end

  def get_key_from_s3_json(s3_file, key)
    file = Tempfile.new
    downloaded = PipelineRun.download_file_with_retries(s3_file, file.path, 3, false)
    value = downloaded ? JSON.parse(File.read(file))[key] : nil
    file.unlink
    value
  end

  def get_pipeline_run_logs(last_n = 30)
    return [] if step_function? && sfn_execution_arn.blank?

    if step_function?
      sfn = SfnExecution.new(execution_arn: sfn_execution_arn, s3_path: sfn_output_path)
      sfn_events = sfn.history.to_h[:events]
      if sfn_events.nil?
        return ["No step function events, step function may have expired"]
      end

      batch_events = sfn_events.reject { |event| event[:task_submitted_event_details].nil? }
      if batch_events.empty?
        return ["No submitted batch jobs"]
      end

      last_job = batch_events[-1]
      job_arn = JSON.parse(last_job[:task_submitted_event_details][:output])["JobArn"]
      batch_job = AwsClient[:batch].describe_jobs({ "jobs": [job_arn] }).to_h[:jobs]
      if batch_job.empty?
        return ["No result from batch job, the batch information may have expired"]
      end

      log_stream_name = batch_job[0][:container][:log_stream_name]
      if log_stream_name.empty?
        return ["No log stream name, batch job may have just started"]
      end

      AwsClient[:cloudwatchlogs].get_log_events({
                                                  "log_group_name": "/aws/batch/job",
                                                  "log_stream_name": log_stream_name,
                                                  "limit": last_n,
                                                }).to_h[:events].pluck(:message)
    end
  end

  def check_for_user_error(failed_stage)
    return [nil, nil] if failed_stage.blank?

    pr = failed_stage.pipeline_run
    # if SFN run, return no user error if the SFN failed to start
    return [nil, nil] if pr.step_function? && pr.sfn_execution_arn.blank?

    if pr.step_function?
      sfn_pipeline_error = pr.sfn_pipeline_error
      sfn_error = sfn_pipeline_error[0]
      error_message = if sfn_pipeline_error[1].nil?
                        WorkflowRun::INPUT_ERRORS[sfn_pipeline_error[0]]
                      else
                        sfn_pipeline_error[1]
                      end
      if WorkflowRun::INPUT_ERRORS.include?(sfn_error)
        return [sfn_error, error_message]
      elsif sfn_error == "UncaughtError"
        return [nil, error_message]
      elsif sfn_error == "RunFailed"
        begin
          # RunFailed errors require another level of parsing in YAML this time
          message = YAML.safe_load(error_message, { symbolize_names: true })[:message]
        rescue StandardError
          return [nil, nil]
        end
        return [nil, message]
      else
        return [nil, nil]
      end
    end

    # TODO: (gdingle): rename to stage_number. See https://jira.czi.team/browse/IDSEQ-1912.
    return [nil, nil] unless [1, 2].include? failed_stage.step_number

    # We need to set the pipeline version in the failed pipeline run so that the host_filter_output_s3_path includes it,
    # i.e. "/results/3.7" instead of "/results"
    # The pipeline version is usually set in the result monitor, but that is not guaranteed to have run by this point.
    if pr.pipeline_version.blank?
      update_pipeline_version(
        pr, :pipeline_version, pr.pipeline_version_file
      )
    end
    user_input_validation_file = "#{pr.host_filter_output_s3_path}/#{PipelineRun::INPUT_VALIDATION_NAME}"
    invalid_step_input_file = "#{pr.host_filter_output_s3_path}/#{PipelineRun::INVALID_STEP_NAME}"
    if file_generated_since_run(failed_stage, user_input_validation_file)
      # Case where validation of user input format fails.
      # The code that produces user_input_validation_file lives here:
      # https://github.com/chanzuckerberg/czid-workflows/blob/a922fa8986715d30a06e20beaa3c92033c799f32/short-read-mngs/idseq-dag/idseq_dag/steps/run_validate_input.py#L117
      validation_error = get_key_from_s3_json(user_input_validation_file, "Validation error")
      return ["FAULTY_INPUT", validation_error] if validation_error
    end
    if file_generated_since_run(failed_stage, invalid_step_input_file)
      # Case where an intermediate output does not meet the requirements for the next step's inputs.
      # Possible error codes defined here: https://github.com/chanzuckerberg/czid-workflows/blob/a922fa8986715d30a06e20beaa3c92033c799f32/short-read-mngs/idseq-dag/idseq_dag/exceptions.py
      error_code = get_key_from_s3_json(invalid_step_input_file, "error")
      return [error_code, nil]
    end
    [nil, nil]
  end

  # Return all pipeline runs that have succeeded for given samples
  # Only check the first pipeline run.
  # samples should be an ActiveRecord relation
  # If strict mode is turned on, error out even if one pipeline run did not succeed.
  # Note: Does NOT do access control checks.
  def get_succeeded_pipeline_runs_for_samples(samples, strict = false, select_options = [])
    default_select_query = [:finalized, :id, :job_status, :s3_output_prefix]
    select_query = default_select_query.concat(select_options)

    # Gets the first pipeline runs for multiple samples in an efficient way.
    pipeline_run_ids = PipelineRun.select("sample_id, MAX(id) as id").where(sample_id: samples.pluck(:id)).group(:sample_id)
    valid_pipeline_runs = PipelineRun
                          .select(select_query)
                          .where("(sample_id, id) IN (?)", pipeline_run_ids)
                          .where(finalized: 1)

    if strict && valid_pipeline_runs.length != samples.length
      raise PIPELINE_RUN_STILL_RUNNING_ERROR
    end

    valid_pipeline_runs = valid_pipeline_runs.where(job_status: PipelineRun::STATUS_CHECKED)
    if strict && valid_pipeline_runs.length != samples.length
      raise PIPELINE_RUN_FAILED_ERROR
    end

    return valid_pipeline_runs
  end

  def get_additional_outputs(status, target_name)
    additional_outputs = status.dig(target_name, "additional_output")
    additional_outputs || []
  end
end
