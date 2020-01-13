require 'shellwords'

class BulkDownload < ApplicationRecord
  include AppConfigHelper
  include SamplesHelper
  include PipelineOutputsHelper
  include BulkDownloadTypesHelper
  include Rails.application.routes.url_helpers
  has_and_belongs_to_many :pipeline_runs
  belongs_to :user
  has_secure_token :access_token

  STATUS_WAITING = "waiting".freeze
  STATUS_RUNNING = "running".freeze
  STATUS_ERROR = "error".freeze
  STATUS_SUCCESS = "success".freeze
  OUTPUT_DOWNLOAD_EXPIRATION = 86_400 # seconds
  PROGRESS_UPDATE_DELAY = 15 # Minimum number of seconds between progress updates.
  ECS_TASK_NAME = "bulk_downloads".freeze

  before_save :convert_params_to_json

  attr_writer :params

  validates :status, presence: true, inclusion: { in: [STATUS_WAITING, STATUS_RUNNING, STATUS_ERROR, STATUS_SUCCESS] }
  validate :params_checks

  # This is a wrapper around the params_json field that exposes params_json as a Hash via "params".
  # You should not ever access params_json or @params directly. Call "params" instead.
  # If you read and write to params, params_json will be updated automatically when you save.
  def params
    # Load params from params_json if necessary.
    if @params.nil? && params_json
      @params = JSON.parse(params_json)
    end
    @params
  end

  def convert_params_to_json
    # Convert params to JSON right before saving.
    if params
      self.params_json = params.to_json
    end
  end

  def params_checks
    if download_type == BulkDownloadTypesHelper::SAMPLE_TAXON_REPORT_BULK_DOWNLOAD_TYPE
      errors.add(:params, "background value must be an integer") unless get_param_value("background").is_a? Integer
    end

    if download_type == BulkDownloadTypesHelper::COMBINED_SAMPLE_TAXON_RESULTS_BULK_DOWNLOAD_TYPE
      metric = get_param_value("metric")
      errors.add(:params, "metrics value is invalid") unless HeatmapHelper::ALL_METRICS.pluck(:value).include?(metric)

      if ["NT.zscore", "NR.zscore"].include?(metric)
        errors.add(:params, "background value must be an integer") unless get_param_value("background").is_a? Integer
      end
    end

    if download_type == BulkDownloadTypesHelper::READS_NON_HOST_BULK_DOWNLOAD_TYPE
      taxa_with_reads = get_param_value("taxa_with_reads")
      errors.add(:params, "taxa_with_reads must be all or an integer") unless taxa_with_reads.is_a?(Integer) || taxa_with_reads == "all"

      if taxa_with_reads == "all"
        errors.add(:params, "file_format must be .fasta or .fastq") unless [".fasta", ".fastq"].include?(get_param_value("file_format"))
      end
    end

    if download_type == BulkDownloadTypesHelper::CONTIGS_NON_HOST_BULK_DOWNLOAD_TYPE
      taxa_with_contigs = get_param_value("taxa_with_contigs")
      errors.add(:params, "taxa_with_contigs must be all or an integer") unless taxa_with_contigs.is_a?(Integer) || taxa_with_contigs == "all"
    end
  end

  # Only bulk downloads created by the user
  def self.viewable(user)
    if user.admin?
      all
    else
      user.bulk_downloads
    end
  end

  def validate_access_token(access_token)
    return self.access_token.present? && self.access_token == access_token
  end

  def output_file_presigned_url
    if status != STATUS_SUCCESS
      return nil
    end

    begin
      return S3_PRESIGNER.presigned_url(:get_object,
                                        bucket: ENV['SAMPLES_BUCKET_NAME'],
                                        key: download_output_key,
                                        expires_in: OUTPUT_DOWNLOAD_EXPIRATION).to_s
    rescue StandardError => e
      LogUtil.log_err_and_airbrake("BulkDownloadPresignError: #{e.inspect}")
    end
    nil
  end

  def server_host
    ENV["SERVER_DOMAIN"]
  end

  def log_stream_name
    if ecs_task_arn.nil?
      nil
    else
      "#{ECS_TASK_NAME}/#{ECS_TASK_NAME}/#{ecs_task_arn.split('/')[-1]}"
    end
  end

  def log_url
    if execution_type == BulkDownloadTypesHelper::ECS_EXECUTION_TYPE && log_stream_name
      AwsUtil.get_cloudwatch_url("bulk_downloads", log_stream_name)
    end
  end

  # The Rails success url that the s3_tar_writer task can ping once it succeeds.
  def success_url
    return nil if server_host.blank?
    "#{server_host}#{bulk_downloads_success_path(access_token: access_token, id: id)}"
  end

  # The Rails error url that the s3_tar_writer task can ping if it fails.
  def error_url
    return nil if server_host.blank?
    "#{server_host}#{bulk_downloads_error_path(access_token: access_token, id: id)}"
  end

  # The Rails progress url that the s3_tar_writer task can ping to update progress.
  def progress_url
    return nil if server_host.blank?
    "#{server_host}#{bulk_downloads_progress_path(access_token: access_token, id: id)}"
  end

  # Returned as an array of strings
  def aegea_ecs_submit_command(
    executable_file_path: nil,
    task_role: "idseq-downloads-#{Rails.env}",
    ecs_cluster: "idseq-fargate-tasks-#{Rails.env}",
    executable_s3_bucket: "aegea-ecs-execute-#{Rails.env}",
    ecr_image: "idseq-s3-tar-writer:latest",
    fargate_cpu: "4096",
    fargate_memory: "8192"
  )
    config_ecr_image = get_app_config(AppConfig::S3_TAR_WRITER_SERVICE_ECR_IMAGE)
    unless config_ecr_image.nil?
      ecr_image = config_ecr_image
    end

    # Use the staging ecs cluster and executable s3 bucket for development.
    if Rails.env == "development"
      ecs_cluster = "idseq-fargate-tasks-staging"
      executable_s3_bucket = "aegea-ecs-execute-staging"
    end

    command_flag = "--execute=#{executable_file_path}"

    command = ["aegea", "ecs", "run",
               command_flag,
               "--task-role", task_role,
               "--task-name", ECS_TASK_NAME,
               "--ecr-image", ecr_image,
               "--fargate-cpu", fargate_cpu,
               "--fargate-memory", fargate_memory,
               "--cluster", ecs_cluster,]

    if executable_file_path.present?
      command += ["--staging-s3-bucket", executable_s3_bucket]
    end

    command
  end

  # Returned as an array of strings
  def s3_tar_writer_command(
    src_urls,
    tar_names,
    dest_url,
    success_url: self.success_url,
    error_url: self.error_url,
    progress_url: self.progress_url
  )
    command = ["python", "s3_tar_writer.py",
               "--src-urls", *src_urls,
               "--tar-names", *tar_names,
               "--dest-url", dest_url,
               "--progress-delay", PROGRESS_UPDATE_DELAY,]

    # The success url is mandatory.
    if success_url
      command += ["--success-url", success_url]
    else
      raise BulkDownloadsHelper::SUCCESS_URL_REQUIRED
    end
    if error_url
      command += ["--error-url", error_url]
    end
    if progress_url
      command += ["--progress-url", progress_url]
    end
    command
  end

  def download_output_key
    "downloads/#{id}/#{BulkDownloadTypesHelper.bulk_download_type_display_name(download_type)}.tar.gz"
  end

  def fetch_output_file_size
    s3_response = S3_CLIENT.head_object(bucket: ENV["SAMPLES_BUCKET_NAME"], key: download_output_key)
    return s3_response.content_length
  rescue => e
    LogUtil.log_backtrace(e)
    LogUtil.log_err_and_airbrake("BulkDownloadsFileSizeError: Failed to get file size for bulk download id #{id}: #{e}")
  end

  # The s3 url that the tar.gz file will be uploaded to.
  def download_output_url
    "s3://#{ENV['SAMPLES_BUCKET_NAME']}/#{download_output_key}"
  end

  def create_local_exec_file(shell_command)
    executable_file = Tempfile.new
    executable_file.write(shell_command)
    executable_file.close
    executable_file
  end

  def kickoff_ecs_task(
    shell_command_array
  )
    executable_file = nil
    shell_command_escaped = shell_command_array.map { |s| Shellwords.escape(s) }.join(" ")
    executable_file = create_local_exec_file(shell_command_escaped)
    aegea_command = aegea_ecs_submit_command(executable_file_path: executable_file.path.to_s)

    command_stdout, command_stderr, status = Open3.capture3(*aegea_command)
    if status.exitstatus.zero?
      output = JSON.parse(command_stdout)
      # Store the taskArn for debugging purposes.
      self.ecs_task_arn = output['taskArn']
      self.status = STATUS_RUNNING
      save!
    else
      self.status = STATUS_ERROR
      self.error_message = BulkDownloadsHelper::KICKOFF_FAILURE
      save!
      raise command_stderr
    end
  ensure
    if executable_file.present?
      executable_file.unlink
    end
  end

  def get_param_field(key, field)
    params.dig(key, field)
  rescue
    # If params is nil or malformed, will return nil
    nil
  end

  def get_param_value(key)
    get_param_field(key, "value")
  end

  def get_param_display_name(key)
    get_param_field(key, "displayName")
  end

  # cleaned_project_names is a map from project id to cleaned project name
  # The prefix is designed to be <= 75 chars.
  # Bulk downloads should ensure that the suffix they add (e.g. contigs_nh.fasta, reads_per_gene.star.tab)
  # is <= 25 chars, so that the total file name is <= 100 chars.
  def get_output_file_prefix(sample, cleaned_project_names)
    # Truncate the project name to 100 chars.
    project_name_truncated = cleaned_project_names[sample.project_id][0...100]
    sample_id_str = "_#{sample.id}_"
    # Truncate the sample name to 65 chars (we keep the truncation fixed so users can parse the file name easier)
    # However, if we ever get to 100M samples, we will need to truncate further.
    max_sample_name_length = [65, 75 - sample_id_str.length].min
    sample_name_truncated = sample.name[0...max_sample_name_length]

    "#{project_name_truncated}_#{sample.project_id}/#{sample_name_truncated}#{sample_id_str}"
  end

  def bulk_download_ecs_task_command
    # Order both pipeline runs and samples by ascending sample id.
    # This ensures that the download src-urls and tar-names have the same order which is critical to
    # mapping the file content to the correct file name.
    pipeline_runs_ordered = pipeline_runs.order(:sample_id)
    samples_ordered = Sample.where(id: pipeline_runs.map(&:sample_id)).order(:id)
    projects = Project.where(id: samples_ordered.pluck(:project_id))

    # Compute cleaned project name once instead of once per sample.
    cleaned_project_names = {}
    projects.each do |project|
      cleaned_project_names[project.id] = project.cleaned_project_name
    end

    download_src_urls = nil
    download_tar_names = nil

    if download_type == ORIGINAL_INPUT_FILE_BULK_DOWNLOAD_TYPE
      samples_ordered = samples_ordered.includes(:input_files)

      download_src_urls = samples_ordered.map(&:input_file_s3_paths).flatten

      # We use the sample name in the output file names (instead of the original input file names)
      # because the sample name is what's visible to the user.
      # Also, there might be duplicates between the original file names.
      download_tar_names = samples_ordered.map do |sample|
        # We assume that the first input file is R1 and the second input file is R2. This is the convention that the pipeline follows.
        sample.input_files.map.with_index do |input_file, input_file_index|
          # Include the project id because the cleaned project names might have duplicates as well.
          "#{get_output_file_prefix(sample, cleaned_project_names)}" \
            "original_R#{input_file_index + 1}.#{input_file.file_type}"
        end
      end.flatten
    end

    if download_type == UNMAPPED_READS_BULK_DOWNLOAD_TYPE
      download_src_urls = pipeline_runs_ordered.map(&:unidentified_fasta_s3_path)

      download_tar_names = samples_ordered.map do |sample|
        "#{get_output_file_prefix(sample, cleaned_project_names)}" \
          "unmapped.fasta"
      end
    end

    if download_type == READS_NON_HOST_BULK_DOWNLOAD_TYPE && get_param_value("file_format") == ".fasta"
      download_src_urls = pipeline_runs_ordered.map(&:annotated_fasta_s3_path)

      download_tar_names = samples_ordered.map do |sample|
        "#{get_output_file_prefix(sample, cleaned_project_names)}" \
          "reads_nh.fasta"
      end
    end

    if download_type == READS_NON_HOST_BULK_DOWNLOAD_TYPE && get_param_value("file_format") == ".fastq"
      pipeline_runs_ordered = pipeline_runs_ordered.includes(sample: [:input_files])

      download_src_urls = pipeline_runs_ordered.map(&:nonhost_fastq_s3_paths).flatten

      download_tar_names = pipeline_runs_ordered.map do |pipeline_run|
        sample = pipeline_run.sample
        file_ext = sample.fasta_input? ? 'fasta' : 'fastq'
        # We assume that the first input file is R1 and the second input file is R2. This is the convention that the pipeline follows.
        sample.input_files.map.with_index do |_input_file, input_file_index|
          # Include the project id because the cleaned project names might have duplicates as well.
          "#{get_output_file_prefix(sample, cleaned_project_names)}" \
            "reads_nh_R#{input_file_index + 1}.#{file_ext}"
        end
      end.flatten
    end

    if download_type == CONTIGS_NON_HOST_BULK_DOWNLOAD_TYPE
      download_src_urls = pipeline_runs_ordered.map(&:contigs_fasta_s3_path)

      download_tar_names = samples_ordered.map do |sample|
        "#{get_output_file_prefix(sample, cleaned_project_names)}" \
            "contigs_nh.fasta"
      end
    end

    if download_type == HOST_GENE_COUNTS_BULK_DOWNLOAD_TYPE
      download_src_urls = pipeline_runs_ordered.map(&:host_gene_count_s3_path)

      download_tar_names = samples_ordered.map do |sample|
        "#{get_output_file_prefix(sample, cleaned_project_names)}" \
          "reads_per_gene.star.tab"
      end
    end

    if !download_src_urls.nil? && !download_tar_names.nil?
      return s3_tar_writer_command(
        download_src_urls,
        download_tar_names,
        download_output_url
      )
    end

    return nil
  end

  # Wrapper function to make testing easier.
  def progress_update_delay
    PROGRESS_UPDATE_DELAY
  end

  def write_output_files_to_s3_tar_writer(s3_tar_writer)
    failed_sample_ids = []
    # The last time since we updated the progress.
    last_progress_time = Time.now.to_f

    samples = Sample.where(id: pipeline_runs.pluck(:sample_id))
    projects = Project.where(id: samples.pluck(:project_id))

    # Compute cleaned project name once instead of once per sample.
    cleaned_project_names = {}
    projects.each do |project|
      cleaned_project_names[project.id] = project.cleaned_project_name
    end

    # Bulk-include data for performance based on the download type.
    pipeline_runs_with_includes = if download_type == SAMPLE_TAXON_REPORT_BULK_DOWNLOAD_TYPE
                                    pipeline_runs.includes(sample: [:project])
                                  elsif download_type == CONTIG_SUMMARY_REPORT_BULK_DOWNLOAD_TYPE
                                    pipeline_runs.includes(:contigs, :sample)
                                  elsif download_type == READS_NON_HOST_BULK_DOWNLOAD_TYPE
                                    # We avoid pre-fetching "taxon_byteranges" here, even though it has to be fetched once per pipeline_run in the code below,
                                    # because of the potentially large number of taxon_byteranges per pipeline_run.
                                    pipeline_runs.includes(:sample)
                                  elsif download_type == CONTIGS_NON_HOST_BULK_DOWNLOAD_TYPE
                                    # Pre-fetching contigs here doesn't prevent multiple queries for contig in get_contigs_for_taxid.
                                    # TODO(mark): Investigate why, if performance of this bulk download ever becomes an issue.
                                    pipeline_runs.includes(:sample)
                                  else
                                    pipeline_runs
                                  end

    # Get the tax_level for the selected taxid by looking at the first available TaxonCount entry.
    # Since TaxonCount isn't normalized, any TaxonCount entry would provide the same information.
    if download_type == READS_NON_HOST_BULK_DOWNLOAD_TYPE
      taxid = get_param_value("taxa_with_reads")

      # Get the corresonding TaxonLineage for this taxid.
      alignment_config_ids = pipeline_runs_with_includes.pluck(:alignment_config_id).uniq
      max_lineage_version  = AlignmentConfig.max_lineage_version(alignment_config_ids)
      taxon_lineage = TaxonLineage.versioned_lineages(taxid, max_lineage_version).first

      if taxon_lineage.nil?
        raise BulkDownloadsHelper::READS_NON_HOST_TAXON_LINEAGE_EXPECTED_TEMPLATE % taxid
      end

      tax_level = taxon_lineage.tax_level
    end

    pipeline_runs_with_includes.map.with_index do |pipeline_run, index|
      begin
        Rails.logger.info("Processing pipeline run #{pipeline_run.id} (#{index + 1} of #{pipeline_runs.length})...")
        if download_type == SAMPLE_TAXON_REPORT_BULK_DOWNLOAD_TYPE
          report_csv = PipelineReportService.call(pipeline_run, get_param_value("background"), csv: true)
          s3_tar_writer.add_file_with_data(
            "#{get_output_file_prefix(pipeline_run.sample, cleaned_project_names)}" \
              "taxon_report.csv",
            report_csv
          )
        elsif download_type == CONTIG_SUMMARY_REPORT_BULK_DOWNLOAD_TYPE
          contig_mapping_table_csv = pipeline_run.generate_contig_mapping_table_csv
          s3_tar_writer.add_file_with_data(
            "#{get_output_file_prefix(pipeline_run.sample, cleaned_project_names)}" \
              "contig_summary_report.csv",
            contig_mapping_table_csv
          )
        elsif download_type == READS_NON_HOST_BULK_DOWNLOAD_TYPE
          reads_nonhost_for_taxid_fasta = get_taxon_fasta_from_pipeline_run_combined_nt_nr(pipeline_run, taxid, tax_level)
          # If there were no reads for a particular pipeline run, output an empty file.
          if reads_nonhost_for_taxid_fasta.nil?
            reads_nonhost_for_taxid_fasta = ""
          end

          # Truncate the taxon so that the total size of the file suffix is 25 characters max.
          taxon_truncated = get_param_display_name('taxa_with_reads')[0...10]

          s3_tar_writer.add_file_with_data(
            "#{get_output_file_prefix(pipeline_run.sample, cleaned_project_names)}" \
              "reads_nh_#{taxon_truncated}.fasta",
            reads_nonhost_for_taxid_fasta
          )
        elsif download_type == CONTIGS_NON_HOST_BULK_DOWNLOAD_TYPE
          contigs = pipeline_run.get_contigs_for_taxid(get_param_value("taxa_with_contigs").to_i)
          contigs_nonhost_for_taxid_fasta = ''
          contigs.each { |contig| contigs_nonhost_for_taxid_fasta += contig.to_fa }

          # Truncate the taxon so that the total size of the file suffix is 25 characters max.
          taxon_truncated = get_param_display_name('taxa_with_contigs')[0...8]

          s3_tar_writer.add_file_with_data(
            "#{get_output_file_prefix(pipeline_run.sample, cleaned_project_names)}" \
              "contigs_nh_#{taxon_truncated}.fasta",
            contigs_nonhost_for_taxid_fasta
          )
        end
      rescue => e
        Rails.logger.error(e)
        failed_sample_ids << pipeline_run.sample.id
      end

      cur_time = Time.now.to_f
      if cur_time - last_progress_time > progress_update_delay
        progress = (index + 1).to_f / pipeline_runs.length
        update(progress: progress)
        Rails.logger.info(format("Updated progress. %3.1f complete.", progress))
        last_progress_time = cur_time
      end
    end

    unless failed_sample_ids.empty?
      LogUtil.log_err_and_airbrake("BulkDownloadFailedSamplesError(id #{id}): The following samples failed to process: #{failed_sample_ids}")
      update(error_message: BulkDownloadsHelper::FAILED_SAMPLES_ERROR_TEMPLATE % failed_sample_ids.length)
    end
  end

  def generate_download_file
    start_time = Time.now.to_f

    update(status: STATUS_RUNNING)

    s3_tar_writer = S3TarWriter.new(download_output_url)
    Rails.logger.info("Starting tarfile streaming to #{download_output_url}...")
    s3_tar_writer.start_streaming

    if download_type == SAMPLE_OVERVIEW_BULK_DOWNLOAD_TYPE
      Rails.logger.info("Generating sample overviews for #{pipeline_runs.length} samples...")
      samples = Sample.where(id: pipeline_runs.pluck(:sample_id))
      pipeline_runs_by_sample_id = pipeline_runs.map { |pr| [pr.sample_id, pr] }.to_h
      formatted_samples = format_samples(samples, pipeline_runs_by_sample_id)
      sample_overviews_csv = generate_sample_list_csv(formatted_samples)

      s3_tar_writer.add_file_with_data("sample_overviews.csv", sample_overviews_csv)
    elsif download_type == COMBINED_SAMPLE_TAXON_RESULTS_BULK_DOWNLOAD_TYPE
      metric = get_param_value("metric")
      Rails.logger.info("Generating combined sample taxon results for #{metric} for #{pipeline_runs.length} samples...")
      samples = Sample.where(id: pipeline_runs.pluck(:sample_id))
      # If the metric is NT.zscore or NR.zscore, the background param is required.
      # For other metrics, it doesn't affect the metric calculation, so we set it to a default.
      # Note that we are using heatmap helper functions to calculate all the metrics at once, so the background id is required even if we don't need it.
      background_id = get_param_value("background") || samples.first.default_background_id
      result = BulkDownloadsHelper.generate_combined_sample_taxon_results_csv(samples, background_id, metric)

      s3_tar_writer.add_file_with_data("combined_sample_taxon_results_#{metric}.csv", result[:csv_str])

      unless result[:failed_sample_ids].empty?
        LogUtil.log_err_and_airbrake("BulkDownloadFailedSamplesError(id #{id}): The following samples failed to process: #{result[:failed_sample_ids]}")
        update(error_message: BulkDownloadsHelper::FAILED_SAMPLES_ERROR_TEMPLATE % result[:failed_sample_ids].length)
      end
    else
      write_output_files_to_s3_tar_writer(s3_tar_writer)
    end

    Rails.logger.info("Closing s3 tar writer...")
    s3_tar_writer.close

    Rails.logger.info("Waiting for streaming to complete...")
    unless s3_tar_writer.process_status.success?
      raise BulkDownloadsHelper::BULK_DOWNLOAD_GENERATION_FAILED
    end

    Rails.logger.info("Success!")
    Rails.logger.info(format("Tarfile of size %s written successfully in %3.1f seconds", ActiveSupport::NumberHelper.number_to_human_size(s3_tar_writer.total_size_processed), Time.now.to_f - start_time))
    mark_success
  rescue
    update(status: STATUS_ERROR)
    raise
  end

  def mark_success
    update(status: STATUS_SUCCESS)

    output_file_size = fetch_output_file_size

    if output_file_size
      update(output_file_size: output_file_size)
    end
  end

  def download_display_name
    display_name = BulkDownloadTypesHelper.bulk_download_type_display_name(download_type)

    # For reads non-host and contigs non-host for a single taxon, add the name of the taxon.
    if download_type == READS_NON_HOST_BULK_DOWNLOAD_TYPE && get_param_value("taxa_with_reads") != "all"
      display_name += " - #{get_param_display_name('taxa_with_reads')}"
    end

    if download_type == CONTIGS_NON_HOST_BULK_DOWNLOAD_TYPE && get_param_value("taxa_with_contigs") != "all"
      display_name += " - #{get_param_display_name('taxa_with_contigs')}"
    end

    display_name
  end

  def execution_type
    execution_type = BulkDownloadTypesHelper.bulk_download_type(download_type)[:execution_type]
    if [RESQUE_EXECUTION_TYPE, ECS_EXECUTION_TYPE]
       .include?(execution_type)
      return execution_type
    end

    if download_type == READS_NON_HOST_BULK_DOWNLOAD_TYPE
      return get_param_value("taxa_with_reads") == "all" ? ECS_EXECUTION_TYPE : RESQUE_EXECUTION_TYPE
    end

    if download_type == CONTIGS_NON_HOST_BULK_DOWNLOAD_TYPE
      return get_param_value("taxa_with_contigs") == "all" ? ECS_EXECUTION_TYPE : RESQUE_EXECUTION_TYPE
    end

    # Should never happen
    raise BulkDownloadsHelper::UNKNOWN_EXECUTION_TYPE
  end

  def kickoff_resque_task
    Resque.enqueue(GenerateBulkDownload, id)
  end

  def kickoff
    current_execution_type = execution_type
    if current_execution_type == ECS_EXECUTION_TYPE
      ecs_task_command = bulk_download_ecs_task_command
      unless ecs_task_command.nil?
        kickoff_ecs_task(ecs_task_command)
      end
    end
    if current_execution_type == RESQUE_EXECUTION_TYPE
      kickoff_resque_task
    end
  end
end
