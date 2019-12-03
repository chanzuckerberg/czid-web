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

  before_save :convert_params_to_json

  attr_accessor :params

  validates :status, presence: true, inclusion: { in: [STATUS_WAITING, STATUS_RUNNING, STATUS_ERROR, STATUS_SUCCESS] }

  def convert_params_to_json
    # We need the params in object form during validation.
    # Convert params to JSON right before saving.
    if params
      self.params_json = params.to_json
    end
  end

  def set_params
    if params_json
      self.params = JSON.parse(params_json)
    end
  end

  # Only bulk downloads created by the user
  def self.viewable(user)
    user.bulk_downloads
  end

  def validate_access_token(access_token)
    return self.access_token.present? && self.access_token == access_token
  end

  def output_file_presigned_url
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
    shell_command,
    task_role: "idseq-downloads-#{Rails.env}",
    ecr_image: "idseq-s3-tar-writer:latest",
    fargate_cpu: "4096",
    fargate_memory: "8192"
  )
    config_ecr_image = get_app_config(AppConfig::S3_TAR_WRITER_SERVICE_ECR_IMAGE)
    unless config_ecr_image.nil?
      ecr_image = config_ecr_image
    end
    shell_command_escaped = shell_command.map { |s| Shellwords.escape(s) }.join(" ")
    ["aegea", "ecs", "run",
     "--command=#{shell_command_escaped}",
     "--task-role", task_role,
     "--task-name", "bulk_download_#{id}",
     "--ecr-image", ecr_image,
     "--fargate-cpu", fargate_cpu,
     "--fargate-memory", fargate_memory,]
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
               "--dest-url", dest_url,]

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

  # The s3 url that the tar.gz file will be uploaded to.
  def download_output_url
    "s3://#{ENV['SAMPLES_BUCKET_NAME']}/#{download_output_key}"
  end

  def kickoff_ecs_task(
    shell_command
  )
    aegea_command = aegea_ecs_submit_command(shell_command)

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
  end

  def get_param_field(key, field)
    # If params is nil, try to set it from params_json
    if params.nil? && params_json.present?
      self.params = JSON.parse(params_json)
    end
    if params.present?
      return params.dig(key, field)
    end
  end

  def get_param_value(key)
    get_param_field(key, "value")
  end

  def get_param_display_name(key)
    get_param_field(key, "displayName")
  end

  # cleaned_project_names is a map from project id to cleaned project name
  def get_output_file_prefix(sample, cleaned_project_names)
    "#{sample.name}__" \
      "#{cleaned_project_names[sample.project_id]}_#{sample.project_id}__"
  end

  def bulk_download_ecs_task_command
    samples = Sample.where(id: pipeline_runs.map(&:sample_id))
    projects = Project.where(id: samples.pluck(:project_id))

    # Compute cleaned project name once instead of once per sample.
    cleaned_project_names = {}
    projects.each do |project|
      cleaned_project_names[project.id] = project.cleaned_project_name
    end

    download_src_urls = nil
    download_tar_names = nil

    if download_type == ORIGINAL_INPUT_FILE_BULK_DOWNLOAD_TYPE
      samples = samples.includes(:input_files)

      download_src_urls = samples.map(&:input_file_s3_paths).flatten

      # We use the sample name in the output file names (instead of the original input file names)
      # because the sample name is what's visible to the user.
      # Also, there might be duplicates between the original file names.
      download_tar_names = samples.map do |sample|
        # We assume that the first input file is R1 and the second input file is R2. This is the convention that the pipeline follows.
        sample.input_files.map.with_index do |input_file, input_file_index|
          # Include the project id because the cleaned project names might have duplicates as well.
          "#{get_output_file_prefix(sample, cleaned_project_names)}" \
            "original_R#{input_file_index + 1}.#{input_file.file_type}"
        end
      end.flatten
    end

    if download_type == UNMAPPED_READS_BULK_DOWNLOAD_TYPE
      download_src_urls = pipeline_runs.map(&:unidentified_fasta_s3_path)

      download_tar_names = samples.map do |sample|
        "#{get_output_file_prefix(sample, cleaned_project_names)}" \
          "unmapped.fasta"
      end
    end

    if download_type == READS_NON_HOST_BULK_DOWNLOAD_TYPE && get_param_value("file_format") == ".fasta"
      download_src_urls = pipeline_runs.map(&:annotated_fasta_s3_path)

      download_tar_names = samples.map do |sample|
        "#{get_output_file_prefix(sample, cleaned_project_names)}" \
          "reads_nonhost_all.fasta"
      end
    end

    if download_type == READS_NON_HOST_BULK_DOWNLOAD_TYPE && get_param_value("file_format") == ".fastq"
      pipeline_runs_with_assocs = pipeline_runs.includes(sample: [:input_files])

      download_src_urls = pipeline_runs_with_assocs.map(&:nonhost_fastq_s3_paths).flatten

      download_tar_names = pipeline_runs_with_assocs.map do |pipeline_run|
        sample = pipeline_run.sample
        file_ext = sample.fasta_input? ? 'fasta' : 'fastq'
        # We assume that the first input file is R1 and the second input file is R2. This is the convention that the pipeline follows.
        sample.input_files.map.with_index do |_input_file, input_file_index|
          # Include the project id because the cleaned project names might have duplicates as well.
          "#{get_output_file_prefix(sample, cleaned_project_names)}" \
            "reads_nonhost_all_R#{input_file_index + 1}.#{file_ext}"
        end
      end.flatten
    end

    if download_type == CONTIGS_NON_HOST_BULK_DOWNLOAD_TYPE
      download_src_urls = pipeline_runs.map(&:contigs_fasta_s3_path)

      download_tar_names = samples.map do |sample|
        "#{get_output_file_prefix(sample, cleaned_project_names)}" \
            "contigs_nonhost_all.fasta"
      end
    end

    if download_type == HOST_GENE_COUNTS_BULK_DOWNLOAD_TYPE
      download_src_urls = pipeline_runs.map(&:host_gene_count_s3_path)

      download_tar_names = samples.map do |sample|
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
                                  else
                                    pipeline_runs
                                  end

    # Get the tax_level for the selected taxid by looking at the first available TaxonCount entry.
    # Since TaxonCount isn't normalized, any TaxonCount entry would provide the same information.
    if download_type == READS_NON_HOST_BULK_DOWNLOAD_TYPE
      taxid = get_param_value("taxa_with_reads")
      if taxid.nil?
        raise BulkDownloadsHelper::READS_NON_HOST_TAXID_EXPECTED
      end

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
          tax_details = ReportHelper.taxonomy_details(pipeline_run.id, get_param_value("background"), TaxonScoringModel::DEFAULT_MODEL_NAME, ReportHelper::DEFAULT_SORT_PARAM)
          report_csv = ReportHelper.generate_report_csv(tax_details)
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

          s3_tar_writer.add_file_with_data(
            "#{get_output_file_prefix(pipeline_run.sample, cleaned_project_names)}" \
              "reads_nonhost_#{get_param_display_name('taxa_with_reads')}.fasta",
            reads_nonhost_for_taxid_fasta
          )
        end
      rescue => e
        Rails.logger.error(e)
        failed_sample_ids << pipeline_run.sample.id
      end

      if Time.now.to_f - last_progress_time > progress_update_delay
        progress = (index + 1).to_f / pipeline_runs.length
        update(progress: progress)
        Rails.logger.info(format("Updated progress. %3.1f complete.", progress))
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
    Rails.logger.info(format("Tarfile of size %s written successfully in %3.1f seconds", StringUtil.human_readable_file_size(s3_tar_writer.total_size_processed), Time.now.to_f - start_time))
    update(status: STATUS_SUCCESS)
  rescue
    update(status: STATUS_ERROR)
    raise
  end

  def execution_type
    execution_type = BulkDownloadTypesHelper.bulk_download_type(download_type)[:execution_type]
    if [RESQUE_EXECUTION_TYPE, ECS_EXECUTION_TYPE]
       .include?(execution_type)
      return execution_type
    end

    if [READS_NON_HOST_BULK_DOWNLOAD_TYPE, CONTIGS_NON_HOST_BULK_DOWNLOAD_TYPE].include?(download_type)
      return get_param_value("taxa_with_reads") == "all" ? ECS_EXECUTION_TYPE : RESQUE_EXECUTION_TYPE
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
