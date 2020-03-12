require 'open3'
require 'json'
require 'tempfile'
require 'aws-sdk'
require 'elasticsearch/model'
# TODO(mark): Move to an initializer. Make sure this works with Rails auto-reloading.

class Sample < ApplicationRecord
  if ELASTICSEARCH_ON
    include Elasticsearch::Model
    after_commit on: [:create, :update] do
      __elasticsearch__.index_document
    end
    after_commit on: [:destroy] do
      begin
        __elasticsearch__.delete_document
      rescue Elasticsearch::Transport::Transport::Errors::NotFound => e
        Rails.logger.warn(e)
      end
    end
  end
  include TestHelper
  include MetadataHelper
  include PipelineRunsHelper
  include BasespaceHelper
  include ErrorHelper

  belongs_to :project
  # This is the user who uploaded the sample, possibly distinct from the user(s) owning the sample's project
  belongs_to :user, counter_cache: true # use .size for cache, use .count to force COUNT query
  belongs_to :host_genome, counter_cache: true # use .size for cache, use .count to force COUNT query
  has_many :pipeline_runs, -> { order(created_at: :desc) }, dependent: :destroy
  has_many :backgrounds, through: :pipeline_runs
  has_many :input_files, dependent: :destroy
  accepts_nested_attributes_for :input_files
  validates_associated :input_files
  has_many :metadata, dependent: :destroy
  has_and_belongs_to_many :visualizations

  STATUS_CREATED = 'created'.freeze
  STATUS_UPLOADED = 'uploaded'.freeze
  STATUS_RERUN    = 'need_rerun'.freeze
  STATUS_RETRY_PR = 'retry_pr'.freeze # retry existing pipeline run
  STATUS_CHECKED = 'checked'.freeze # status regarding pipeline kickoff is checked
  validates :status, presence: true, inclusion: { in: [
    STATUS_CREATED,
    STATUS_UPLOADED,
    STATUS_RERUN,
    STATUS_RETRY_PR,
    STATUS_CHECKED,
  ], }, if: :mass_validation_enabled?

  validate :input_files_checks
  validates :name, presence: true, uniqueness: { scope: :project_id, case_sensitive: false }

  validates :web_commit, presence: true, allow_blank: true, if: :mass_validation_enabled?
  validates :pipeline_commit, presence: true, allow_blank: true, if: :mass_validation_enabled?
  validates :uploaded_from_basespace, presence: true, inclusion: { in: [0, 1] }, if: :mass_validation_enabled?

  after_create :initiate_input_file_upload
  before_save :check_host_genome, :concatenate_input_parts, :check_status
  after_save :set_presigned_url_for_local_upload

  # Constants for upload errors.
  UPLOAD_ERROR_BASESPACE_UPLOAD_FAILED = "BASESPACE_UPLOAD_FAILED".freeze
  UPLOAD_ERROR_S3_UPLOAD_FAILED = "S3_UPLOAD_FAILED".freeze
  UPLOAD_ERROR_LOCAL_UPLOAD_STALLED = "LOCAL_UPLOAD_STALLED".freeze
  UPLOAD_ERROR_LOCAL_UPLOAD_FAILED = "LOCAL_UPLOAD_FAILED".freeze
  DO_NOT_PROCESS = "DO_NOT_PROCESS".freeze

  TOTAL_READS_JSON = "total_reads.json".freeze
  LOG_BASENAME = 'log.txt'.freeze

  LOCAL_INPUT_PART_PATH = '/app/tmp/input_parts'.freeze
  ASSEMBLY_DIR = 'assembly'.freeze

  # TODO: Make all these params configurable without code change
  DEFAULT_STORAGE_IN_GB = 1000
  DEFAULT_MEMORY_IN_MB = 120_000 # sorry, hacky
  HIMEM_IN_MB = 240_000

  DEFAULT_QUEUE = (Rails.env == 'prod' ? 'idseq-prod-lomem' : 'idseq-staging-lomem').freeze
  DEFAULT_VCPUS = 16

  DEFAULT_QUEUE_HIMEM = (Rails.env == 'prod' ? 'idseq-prod-himem' : 'idseq-staging-himem').freeze
  DEFAULT_VCPUS_HIMEM = 32

  METADATA_FIELDS = [:sample_notes].freeze

  SLEEP_SECONDS_BETWEEN_RETRIES = 10

  # Maximum allowed line length in characters for fastq/fasta files
  MAX_LINE_LENGTH = 10_000
  # Error message to identify parse errors from fastq-fasta-line-validation.awk
  PARSE_ERROR_MESSAGE = 'PARSE ERROR'.freeze
  # Script parameters
  FASTQ_FASTA_LINE_VALIDATION_AWK_SCRIPT = Rails.root.join("scripts", "fastq-fasta-line-validation.awk").to_s

  # These are temporary variables that are not saved to the database. They only persist for the lifetime of the Sample object.
  attr_accessor :bulk_mode, :basespace_dataset_id

  # getter
  attr_reader :bulk_mode

  # setter
  attr_writer :bulk_mode

  def sample_path
    File.join('samples', project_id.to_s, id.to_s)
  end

  def pipeline_versions
    prvs = []
    pipeline_runs.joins(:taxon_counts).distinct.each do |pr|
      prvs << (pr.pipeline_version.nil? ? PipelineRun::PIPELINE_VERSION_WHEN_NULL : pr.pipeline_version)
    end
    prvs.uniq
  end

  def pipeline_runs_info
    prvs = {}
    pipeline_runs.left_joins(:taxon_counts, :alignment_config).order(created_at: :desc).distinct.each do |pr|
      prvs[pr.pipeline_version] ||= {
        id: pr.id,
        pipeline_version: pr.pipeline_version.nil? ? PipelineRun::PIPELINE_VERSION_WHEN_NULL : pr.pipeline_version,
        created_at: pr.created_at,
        alignment_config_name: pr.alignment_config.name,
        assembled: pr.assembled.to_i,
        adjusted_remaining_reads: pr.adjusted_remaining_reads,
      }
    end
    prvs.values
  end

  def fasta_input?
    ["fasta", "fa", "fasta.gz", "fa.gz"].include?(input_files[0].file_type)
  end

  def pipeline_run_by_version(pipeline_version)
    # Right now we don't filter for successful pipeline runs. we should do that at some point.
    prs = if pipeline_version == PipelineRun::PIPELINE_VERSION_WHEN_NULL
            pipeline_runs.where(pipeline_version: nil)
          else
            pipeline_runs.where(pipeline_version: pipeline_version)
          end

    prs.each { |pr| return pr unless pr.taxon_counts.empty? }
    prs.first
  end

  validates_associated :input_files

  def input_files_checks
    # validate that we have the correct number of input files
    errors.add(:input_files, "invalid number (#{input_files.size})") unless
      input_files.size.between?(1, 2) || (uploaded_from_basespace? && input_files.empty?)

    # validate that both input files have the same source_type and file_type
    if input_files.length == 2
      errors.add(:input_files, "have different source types") unless input_files[0].source_type == input_files[1].source_type
      errors.add(:input_files, "have different file formats") unless input_files[0].file_type == input_files[1].file_type
      if input_files[0].source == input_files[1].source
        errors.add(:input_files, "have identical read 1 source and read 2 source")
      end
    end
  end

  def required_metadata_fields
    # Don't use "where", as this will trigger another SQL query when used inside loops.
    (host_genome.metadata_fields & project.metadata_fields).select { |x| x.is_required == 1 }
  end

  def missing_required_metadata_fields
    required_metadata_fields - metadata.map(&:metadata_field)
  end

  def set_presigned_url_for_local_upload
    use_acceleration = nil
    input_files.each do |f|
      if f.source_type == InputFile::SOURCE_TYPE_LOCAL && f.parts
        if use_acceleration.nil?
          accel_response = S3_CLIENT.get_bucket_accelerate_configuration(bucket: SAMPLES_BUCKET_NAME)
          use_acceleration = accel_response && accel_response[:status] == "Enabled"
        end

        # TODO: investigate the content-md5 stuff https://github.com/aws/aws-sdk-js/issues/151 https://gist.github.com/algorist/385616
        parts = f.parts.split(", ")
        presigned_urls = parts.map do |part|
          S3_PRESIGNER.presigned_url(:put_object, expires_in: 86_400, bucket: SAMPLES_BUCKET_NAME,
                                                  key: File.join(File.dirname(f.file_path), File.basename(part)), use_accelerate_endpoint: use_acceleration)
        end
        f.update(presigned_url: presigned_urls.join(", "))
      end
    end
  end

  # Find sample results based on the string searched. Supports direct search on
  # sample attributes and search by pathogen name presence.
  # TODO: Add Metadatum 2.0 and other search capabilities.
  def self.search(search, eligible_pr_ids = [])
    # pipeline_run_ids to restrict the set of pipeline runs to search
    if search
      search = search.strip
      results = where('samples.name LIKE :search
        OR samples.sample_notes LIKE :search', search: "%#{search}%")

      unless eligible_pr_ids.empty?
        # Require scope of eligible pipeline runs for pathogen search

        # Get taxids that match the query name at any tax level
        matching_taxids = TaxonLineage.where("tax_name LIKE :search", search: "#{search}%").pluck(:taxid)

        # Get pipeline runs that match the taxids
        matching_pr_ids = TaxonByterange.where(taxid: matching_taxids).pluck(:pipeline_run_id)

        # Filter to the eligible and matching pipeline runs. Used IDs because of
        # some "'id' in IN/ALL/ANY subquery is ambiguous" issue with chained
        # queries.
        filtered_pr_ids = eligible_pr_ids && matching_pr_ids

        # Find the sample ids
        sample_ids = PipelineRun.joins(:sample).where(id: filtered_pr_ids).pluck(:'pipeline_runs.sample_id').uniq
        pathogen_results = where(id: sample_ids)

        results = results.or(pathogen_results)
      end

      results
    else
      scoped
    end
  end

  def self.get_signed_url(s3key)
    begin
      if s3key.present?
        return S3_PRESIGNER.presigned_url(:get_object,
                                          bucket: SAMPLES_BUCKET_NAME, key: s3key,
                                          expires_in: SAMPLE_DOWNLOAD_EXPIRATION).to_s
      end
    rescue StandardError => e
      LogUtil.log_err_and_airbrake("AWS presign error: #{e.inspect}")
    end
    nil
  end

  def end_path(key, n = 1)
    output = []
    parts = key.split('/')
    (1..n).each do |k|
      output.unshift(parts[-k])
    end
    output.join("/")
  end

  def list_outputs(s3_path, display_prefix = 1, delimiter = "/")
    return TEST_RESULT_FOLDER if Rails.env == "test"
    prefix = s3_path.split("#{SAMPLES_BUCKET_NAME}/")[1]
    file_list = S3_CLIENT.list_objects(bucket: SAMPLES_BUCKET_NAME,
                                       prefix: "#{prefix}/",
                                       delimiter: delimiter)
    file_list.contents.map do |f|
      {
        key: f.key,
        display_name: end_path(f.key, display_prefix),
        url: Sample.get_signed_url(f.key),
        size: ActiveSupport::NumberHelper.number_to_human_size(f.size),
      }
    end
  end

  def results_folder_files(pipeline_version = nil)
    pr = pipeline_version ? pipeline_run_by_version(pipeline_version) : first_pipeline_run
    return list_outputs(sample_output_s3_path) unless pr
    file_list = []
    if pipeline_version_at_least_2(pr.pipeline_version)
      file_list = list_outputs(pr.output_s3_path_with_version)
      file_list += list_outputs(sample_output_s3_path)
      file_list += list_outputs(pr.postprocess_output_s3_path)
      file_list += list_outputs(pr.postprocess_output_s3_path + '/' + ASSEMBLY_DIR)
      file_list += list_outputs(pr.expt_output_s3_path)
    else
      stage1_files = list_outputs(pr.host_filter_output_s3_path)
      stage2_files = list_outputs(pr.alignment_output_s3_path, 2)
      file_list = stage1_files + stage2_files
    end
    file_list
  end

  def fastqs_folder_files
    list_outputs(sample_input_s3_path)
  end

  def initiate_input_file_upload
    # The reason why we don't check input_files.first.source_type == InputFile::SOURCE_TYPE_BASESPACE here is:
    # We don't yet have the input files at this point.
    # The basespace API doesn't let us query for all input files for a project.
    # We can only query all the datasets (and get the dataset IDs).
    # We then need to query each dataset individually (with a separate API call) to get the input files.
    # We do this query inside the TransferBasespaceFiles resque task.
    if uploaded_from_basespace?
      Resque.enqueue(TransferBasespaceFiles, id, basespace_dataset_id, basespace_access_token)
    elsif !input_files.empty? && input_files.first.source_type == InputFile::SOURCE_TYPE_S3
      Resque.enqueue(InitiateS3Cp, id)
    end
  end

  def initiate_s3_cp
    return unless status == STATUS_CREATED
    stderr_array = []
    total_reads_json_path = nil
    max_lines = 4 * (max_input_fragments || PipelineRun::DEFAULT_MAX_INPUT_FRAGMENTS)
    input_files.each do |input_file|
      fastq = input_file.source
      total_reads_json_path = File.join(File.dirname(fastq.to_s), TOTAL_READS_JSON)

      # Retry s3 cp up to 3 times
      max_tries = 3
      try = 0
      while try < max_tries
        # Run the piped commands and save stderr
        err_read, err_write = IO.pipe
        if fastq.match?(/\.gz/)
          proc_download, proc_unzip, proc_cut, proc_head, proc_validation, proc_zip, proc_upload = Open3.pipeline(
            ["aws", "s3", "cp", fastq, "-"],
            ["gzip", "-dc"],
            ["cut", "-c", "-#{Sample::MAX_LINE_LENGTH + 1}"],
            ["head", "-n", max_lines.to_s],
            ["awk", "-f", FASTQ_FASTA_LINE_VALIDATION_AWK_SCRIPT, "-v", "max_line_length=#{Sample::MAX_LINE_LENGTH}"],
            ["gzip", "-c"],
            ["aws", "s3", "cp", "-", "#{sample_input_s3_path}/#{input_file.name}"],
            err: err_write
          )
          to_check = {
            sig_pipe: [proc_unzip, proc_cut],
            no_errors: [proc_head, proc_validation, proc_zip, proc_upload],
          }
        else
          proc_download, proc_cut, proc_head, proc_validation, proc_upload = Open3.pipeline(
            ["aws", "s3", "cp", fastq, "-"],
            ["cut", "-c", "-#{Sample::MAX_LINE_LENGTH + 1}"],
            ["head", "-n", max_lines.to_s],
            ["awk", "-f", FASTQ_FASTA_LINE_VALIDATION_AWK_SCRIPT, "-v", "max_line_length=#{Sample::MAX_LINE_LENGTH}"],
            ["aws", "s3", "cp", "-", "#{sample_input_s3_path}/#{input_file.name}"],
            err: err_write
          )
          to_check = {
            sig_pipe: [proc_cut],
            no_errors: [proc_head, proc_validation, proc_upload],
          }
        end
        err_write.close
        stderr = err_read.read

        # Whenever the file has more lines than the accepted limit,
        # head command interrupts the stream and all previous commands receive a
        # SIGPIPE 13 'pipe broken'. This is an expected condition that shouldn't be
        # considered as an error.
        if (
             # exitstatus is 0 when input file is small enough to be read in a single fetch
             proc_download&.exitstatus&.zero? ||
             # exitstatus is 1 when input file is too big and aws cp still have its connection open
             (proc_download&.exitstatus == 1 && stderr.include?(InputFile::S3_CP_PIPE_ERROR))
        ) &&
           to_check[:sig_pipe].all? { |p| p&.termsig == 13 } &&
           to_check[:no_errors].all? { |p| p&.exitstatus&.zero? }
          # Success
          break
        elsif to_check.values.flatten.all? { |p| p&.exitstatus&.zero? }
          # Success
          break
        elsif proc_validation&.exitstatus&.nonzero? && stderr.include?(Sample::PARSE_ERROR_MESSAGE)
          error_msg = "Error parsing upload of S3 sample '#{name}' (#{id}) file '#{fastq}' failed with: #{stderr}"
          Rails.logger.error(error_msg)
          stderr_array << error_msg
          break
        else
          # Try again
          Rails.logger.error("Try ##{try}: Upload of S3 sample '#{name}' (#{id}) file '#{fastq}' failed with: #{stderr}")
          try += 1

          # Record final stderr if exceeding max tries
          stderr_array << stderr if try == max_tries
          sleep(Sample::SLEEP_SECONDS_BETWEEN_RETRIES)
        end
      end
    end

    if total_reads_json_path.present?
      # For samples where we are only given fastas post host filtering, we need to input the total reads (before host filtering) from this file.
      _stdout, _stderr, status = Open3.capture3("aws", "s3", "cp", total_reads_json_path, "#{sample_input_s3_path}/#{TOTAL_READS_JSON}")
      # We don't have a good way to know if this file should be present or not, so we just try to upload it
      # and if it fails, we try one more time;  if that fails too, it's okay, the file is optional.
      unless status.exitstatus.zero?
        sleep(1.0)
        _stdout, _stderr, _status = Open3.capture3("aws", "s3", "cp", total_reads_json_path, "#{sample_input_s3_path}/#{TOTAL_READS_JSON}")
      end
    end
    if s3_preload_result_path.present? && s3_preload_result_path[0..4] == 's3://'
      _stdout, stderr, status = Open3.capture3("aws", "s3", "cp", s3_preload_result_path.to_s, sample_output_s3_path.to_s, "--recursive")
      stderr_array << stderr unless status.exitstatus.zero?
    end

    raise stderr_array.join(" ") unless stderr_array.empty?

    self.status = STATUS_UPLOADED
    save! # this triggers pipeline command
  rescue => e
    LogUtil.log_err_and_airbrake("[Datadog] SampleUploadFailedEvent: Failed to upload S3 sample '#{name}' (#{id}): #{e}")
    self.status = STATUS_CHECKED
    self.upload_error = Sample::UPLOAD_ERROR_S3_UPLOAD_FAILED
    save!
  end

  # Uploads input files from basespace for this sample.
  # basespace_dataset_id is the id of the dataset from basespace we are uploading samples from.
  #   A dataset is a basespace concept meaning a collection of one or more related files (such as paired fastq files)
  # basespace_access_token is the access token that authorizes us to download these files.
  def transfer_basespace_files(basespace_dataset_id, basespace_access_token)
    # Only continue if the sample status is CREATED and not yet UPLOADED.
    return unless status == STATUS_CREATED

    files = files_for_basespace_dataset(basespace_dataset_id, basespace_access_token)

    # Raise error if fetching the files failed, or we fetched zero files (since we can't proceed with zero files)
    raise SampleUploadErrors.error_fetching_basespace_files_for_dataset(basespace_dataset_id, name, id) if files.nil?
    raise SampleUploadErrors.no_files_in_basespace_dataset(basespace_dataset_id, name, id) if files.empty?

    # Retry uploading three times, in case of transient network failures.
    files.each do |file|
      max_tries = 3
      try = 0
      # Use exponential backoff in case the issue is overload on Illumina servers.
      time_between_tries = [60, 300]

      Rails.logger.info("Starting upload of sample '#{name}' (#{id}) file '#{file[:name]}' from Basespace")
      while try < max_tries
        success = upload_from_basespace_to_s3(file[:download_path], sample_input_s3_path, file[:name])

        if success
          break
        else
          Rails.logger.error("Try ##{try}: Upload of sample '#{name}' (#{id}) file '#{file[:name]}' from Basespace failed")
          try += 1
          if try < max_tries
            Kernel.sleep(time_between_tries[try - 1])
          else
            raise SampleUploadErrors.upload_from_basespace_failed(name, id, file[:name], basespace_dataset_id, max_tries)
          end
        end
      end

      input_file = InputFile.new(
        name: file[:name],
        source_type: InputFile::SOURCE_TYPE_BASESPACE,
        source: file[:source_path]
      )

      input_files << input_file
    end

    self.status = STATUS_UPLOADED
    save!
  rescue => e
    Rails.logger.info(e)
    LogUtil.log_err_and_airbrake("SampleUploadFailedEvent: #{e}")

    self.status = STATUS_CHECKED
    self.upload_error = Sample::UPLOAD_ERROR_BASESPACE_UPLOAD_FAILED

    # It's possible the error is caused by failed validation on the input files.
    # Clear the input files before trying to save again.
    self.input_files = []
    save!
  end

  def uploaded_from_basespace?
    uploaded_from_basespace == 1
  end

  def sample_input_s3_path
    "s3://#{ENV['SAMPLES_BUCKET_NAME']}/#{sample_path}/fastqs"
  end

  def filter_host_flag
    host_genome && host_genome.name == HostGenome::NO_HOST_NAME ? 0 : 1
  end

  def skip_deutero_filter_flag
    !host_genome || host_genome.skip_deutero_filter == 1 ? 1 : 0
  end

  def sample_output_s3_path
    "s3://#{ENV['SAMPLES_BUCKET_NAME']}/#{sample_path}/results"
  end

  def sample_alignment_output_s3_path
    pr = first_pipeline_run
    return pr.alignment_output_s3_path
  rescue
    return sample_output_s3_path
  end

  def sample_host_filter_output_s3_path
    pr = first_pipeline_run
    return pr.host_filter_output_s3_path
  rescue
    return sample_output_s3_path
  end

  def subsample_suffix
    pr = first_pipeline_run
    pr.subsample_suffix
  end

  def sample_postprocess_s3_path
    "s3://#{ENV['SAMPLES_BUCKET_NAME']}/#{sample_path}/postprocess"
  end

  # This is for the "Experimental" pipeline run stage and path where results
  # for this stage are outputted. Currently, Antimicrobial Resistance
  # outputs are in this path.
  def sample_expt_s3_path
    "s3://#{ENV['SAMPLES_BUCKET_NAME']}/#{sample_path}/expt"
  end

  def host_genome_name
    host_genome.name if host_genome
  end

  def default_background_id
    host_genome && host_genome.default_background ? host_genome.default_background.id : Background.find_by(public_access: 1).id
  end

  def as_json(options = {})
    options[:methods] ||= [:input_files, :host_genome_name, :private_until]
    super(options)
  end

  def check_host_genome
    # Host genome should always be present.
    if host_genome.present?
      # Unclear purpose of copying this info. See also host_subtracted.
      self.s3_star_index_path = host_genome.s3_star_index_path
      self.s3_bowtie2_index_path = host_genome.s3_bowtie2_index_path
    end
    s3_preload_result_path ||= ''
    s3_preload_result_path.strip!
  end

  def concatenate_input_parts
    return unless status == STATUS_UPLOADED
    begin
      input_files.each do |f|
        next unless f.source_type == InputFile::SOURCE_TYPE_LOCAL
        parts = f.parts.split(", ")
        next unless parts.length > 1
        source_parts = []
        local_path = "#{LOCAL_INPUT_PART_PATH}/#{id}/#{f.id}"
        parts.each_with_index do |part, index|
          source_part = File.join("s3://#{SAMPLES_BUCKET_NAME}", File.dirname(f.file_path), File.basename(part))
          source_parts << source_part
          Syscall.run("aws", "s3", "cp", source_part, "#{local_path}/#{index}")
        end
        Syscall.run_in_dir(local_path, "cat * > complete_file")
        Syscall.run_in_dir(local_path, "aws", "s3", "cp", "complete_file", "s3://#{SAMPLES_BUCKET_NAME}/#{f.file_path}")
        Syscall.run("rm", "-rf", local_path)
        source_parts.each do |source_part|
          Syscall.run("aws", "s3", "rm", source_part)
        end
      end
    rescue
      LogUtil.log_err_and_airbrake("Failed to concatenate input parts for sample #{id}")
    end
  end

  def check_status
    return unless [STATUS_UPLOADED, STATUS_RERUN, STATUS_RETRY_PR].include?(status)
    pr = first_pipeline_run
    transient_status = status
    self.status = STATUS_CHECKED

    if transient_status == STATUS_RETRY_PR && pr
      pr.retry
    else
      kickoff_pipeline
    end
  end

  # Delay determined based on query of historical upload times, where 80%
  # of successful uploads took less than 3 hours by client_updated_at.
  def self.current_stalled_local_uploads(delay = 3.hours)
    where(status: STATUS_CREATED)
      .where("samples.created_at < ?", Time.now.utc - delay)
      .joins(:input_files)
      .where(input_files: { source_type: InputFile::SOURCE_TYPE_LOCAL })
      .distinct
  end

  def destroy
    TaxonByterange.where(pipeline_run_id: pipeline_run_ids).delete_all
    TaxonCount.where(pipeline_run_id: pipeline_run_ids).delete_all
    Contig.where(pipeline_run_id: pipeline_run_ids).delete_all
    AmrCount.where(pipeline_run_id: pipeline_run_ids).delete_all
    ErccCount.where(pipeline_run_id: pipeline_run_ids).delete_all
    JobStat.where(pipeline_run_id: pipeline_run_ids).delete_all
    input_files.delete_all
    metadata.delete_all
    super
  end

  def self.viewable(user)
    if user.admin?
      all
    else
      project_ids = Project.editable(user).select("id").pluck(:id)
      joins(:project)
        .where("(project_id in (?) or
                projects.public_access = 1 or
                DATE_ADD(samples.created_at, INTERVAL projects.days_to_keep_sample_private DAY) < ?)",
               project_ids, Time.current)
    end
  end

  def self.editable(user)
    if user.admin?
      all
    else
      my_data(user)
    end
  end

  def self.my_data(user)
    project_ids = user.projects.pluck(:id)
    where("project_id in (?)", project_ids)
  end

  def deletable?(user)
    if user.admin?
      return true
    elsif user_id == user.id
      # Sample belongs to the user
      # Allow deletion if no pipeline runs, or report failed.
      # The following returns true for an empty array
      return pipeline_runs.all?(&:report_failed?)
    end

    false
  end

  def self.public_samples
    joins(:project)
      .where("(projects.public_access = 1 OR
              DATE_ADD(samples.created_at, INTERVAL projects.days_to_keep_sample_private DAY) < ?)",
             Time.current)
  end

  def self.private_samples
    joins(:project)
      .where("(projects.public_access = 0 AND
              DATE_ADD(samples.created_at, INTERVAL projects.days_to_keep_sample_private DAY) >= ?)",
             Time.current)
  end

  def self.samples_going_public_in_period(range, user = nil, project = nil)
    query = joins(:project)
            .where("projects.public_access != 1")
            .where("DATE_ADD(samples.created_at, INTERVAL projects.days_to_keep_sample_private DAY) BETWEEN ? AND ?", range[0], range[1])

    query = query.where(user: user) if user
    query = query.where(project: project) if project

    return query
  end

  def archive_old_pipeline_runs
    old_pipeline_runs = pipeline_runs.order('id desc').offset(1)
    old_pipeline_runs.each do |pr|
      # Write pipeline_run data to file
      json_output = pr.to_json(include: [:pipeline_run_stages,
                                         :taxon_counts,
                                         :taxon_byteranges,
                                         :job_stats,])
      file = Tempfile.new
      file.write(json_output)
      file.close
      # Copy file to S3
      pr_s3_file_name = "pipeline_run_#{pr.id}.json"
      _stdout, _stderr, status = Open3.capture3("aws", "s3", "cp", file.path.to_s,
                                                "#{pr.archive_s3_path}/#{pr_s3_file_name}")
      # Delete any taxon_counts / taxon_byteranges associated with the pipeline run
      if !File.zero?(file.path) && status.exitstatus && status.exitstatus.zero?
        TaxonCount.where(pipeline_run_id: pr.id).delete_all
        TaxonByterange.where(pipeline_run_id: pr.id).delete_all
      end
      file.unlink
    end
  end

  def reload_old_pipeline_runs
    old_pipeline_runs = pipeline_runs.order('id desc').offset(1)
    old_pipeline_runs.each do |pr|
      next unless pr.succeeded?
      next unless pr.taxon_counts.empty?
      pr_s3_file_name = "#{pr.archive_s3_path}/pipeline_run_#{pr.id}.json"
      pr_local_file_name = PipelineRun.download_file(pr_s3_file_name, pr.local_json_path)
      next unless pr_local_file_name
      json_dict = JSON.parse(File.read(pr_local_file_name))
      json_dict = json_dict["pipeline_output"] if json_dict["pipeline_output"]
      taxon_counts = (json_dict["taxon_counts"] || {}).map do |txn|
        txn.slice("tax_id", "tax_level", "count", "created_at", "name", "count_type", "percent_identity", "alignment_length", "e_value", "genus_taxid", "superkingdom_taxid", "percent_concordant", "species_total_concordant", "genus_total_concordant", "family_total_concordant", "common_name", "family_taxid", "is_phage")
      end
      taxon_byteranges = (json_dict["taxon_byteranges"] || {}).map do |txn|
        txn.slice("taxid", "first_byte", "last_byte", "created_at", "hit_type", "tax_level")
      end

      pr.taxon_counts_attributes = taxon_counts unless taxon_counts.empty?
      pr.taxon_byteranges_attributes = taxon_byteranges unless taxon_byteranges.empty?
      pr.save
    end
  end

  def self.pipeline_commit(branch)
    o = Syscall.pipe_with_output(["git", "ls-remote", "https://github.com/chanzuckerberg/idseq-dag.git"], ["grep", "refs/heads/#{branch}"])
    return false if o.blank?
    o.split[0]
  end

  def kickoff_pipeline
    # only kickoff pipeline when no active pipeline_run running
    return unless pipeline_runs.in_progress.empty?

    if do_not_process
      update(status: STATUS_CHECKED, upload_error: Sample::DO_NOT_PROCESS)
      return
    end

    pr = PipelineRun.new
    pr.sample = self
    pr.subsample = subsample || PipelineRun::DEFAULT_SUBSAMPLING
    pr.max_input_fragments = max_input_fragments || PipelineRun::DEFAULT_MAX_INPUT_FRAGMENTS
    pr.pipeline_branch = pipeline_branch.blank? ? "master" : pipeline_branch
    pr.pipeline_execution_strategy = pipeline_execution_strategy.blank? ? PipelineRun.directed_acyclic_graph : pipeline_execution_strategy
    pr.dag_vars = dag_vars if dag_vars
    pr.use_taxon_whitelist = use_taxon_whitelist
    pr.pipeline_commit = Sample.pipeline_commit(pr.pipeline_branch)

    pr.alignment_config = AlignmentConfig.find_by(name: alignment_config_name) if alignment_config_name
    pr.alignment_config ||= AlignmentConfig.find_by(name: AlignmentConfig::DEFAULT_NAME)
    pr.save
  end

  def get_existing_metadatum(key)
    return metadata.find { |metadatum| metadatum.metadata_field.name == key || metadatum.metadata_field.display_name == key }
  end

  # Ensure that an appropriate metadata field exists for the given key.
  # Add core fields to the sample's project if needed.
  # Create custom fields if needed.
  # Return a string describe the status of the metadata field.
  def ensure_metadata_field_for_key(key)
    metadata_field = get_existing_metadatum(key.to_s) || get_available_matching_field(self, key.to_s)

    if metadata_field
      # Return ok if the field already exists and no additional actions were needed.
      return "ok"
    end

    metadata_field = get_matching_core_field(self, key.to_s)

    # This is a core field that isn't currently part of the project.
    # Add it to the project.
    if metadata_field
      project.metadata_fields.append(metadata_field)
      return "core"
    end

    metadata_field = get_new_custom_field(key.to_s)
    metadata_field.save

    # Add the new custom field to the project
    # and all host genomes.
    project.metadata_fields.append(metadata_field)
    HostGenome.all.each do |genome|
      genome.metadata_fields.append(metadata_field)
    end

    return "custom"
  end

  # Create or update the Metadatum ActiveRecord object, but do not save.
  # This allows us to do this in batch.
  # NOTE: ensure_metadata_field_for_key should be called before this, to ensure a matching metadata field is available.
  def get_metadatum_to_save(key, val)
    m = get_existing_metadatum(key.to_s)
    unless m
      # Create the entry
      m = Metadatum.new
      m.sample = self

      # Find the appropriate metadata field.
      # ensure_metadata_field_for_key should ensure that a matching field exists.
      m.metadata_field = get_available_matching_field(self, key.to_s)

      raise RecordNotFound("No matching field for #{key}") unless m.metadata_field
      m.key = m.metadata_field.name
    end
    if val.present? && m.raw_value != val
      m.raw_value = val.is_a?(ActionController::Parameters) ? val.to_json : val
      return {
        metadatum: m,
        status: "ok",
      }
    else
      # If the value didn't change or isn't present, don't re-save the metadata field.
      if m.id && val.blank?
        # If the object existed and the user cleared out the new value, delete it.
        m.delete
      end
      return {
        metadatum: nil,
        status: "ok",
      }
    end
  rescue ActiveRecord::RecordNotFound => e
    Rails.logger.error(e)
    return {
      metadatum: nil,
      status: "error",
      error: e,
    }
  end

  # Add or update metadatum entry on this sample.
  # Returns whether the update succeeded and any errors.
  def metadatum_add_or_update(key, val)
    ensure_metadata_field_for_key(key)
    result = get_metadatum_to_save(key, val)

    if result[:status] == "error"
      return {
        status: "error",
        error: result[:error],
      }
    elsif result[:metadatum]
      if result[:metadatum].valid?
        result[:metadatum].save!
        return {
          status: "ok",
        }
      else
        return {
          status: "error",
          # Get the error from ErrorHelper, instead of using the error from metadatum model.
          # The error from ErrorHelper is more user-friendly ("Please input a number") whereas metadatum model is "Invalid number for field"
          error: get_field_error(result[:metadatum].metadata_field, host_genome_name == "Human"),
        }
      end
    else
      return {
        status: "ok",
      }
    end
  rescue ActiveRecord::RecordInvalid => e
    Rails.logger.error(e)
    # Don't send the detailed error message to the user.
    return {
      status: "error",
      error: "There was an error saving your metadata.",
    }
  rescue ActiveRecord::RangeError => e
    Rails.logger.error(e)
    # Don't send the detailed error message to the user.
    return {
      status: "error",
      error: "The value you provided was too large.",
    }
  end

  # Validate metadatum entry on this sample, without saving.
  def metadatum_validate(key, val)
    m = Metadatum.new
    m.metadata_field = get_available_matching_field(self, key.to_s)

    unless m.metadata_field
      m.metadata_field = get_matching_core_field(self, key.to_s)
    end

    # Only perform this validation if a metadata field was found. Otherwise, we will be creating a custom field which will accept anything.
    if m.metadata_field
      m.key = m.metadata_field.name
      m.sample = self
      m.raw_value = val.is_a?(ActionController::Parameters) ? val.to_json : val
    end

    {
      errors: m.valid? ? {} : m.errors,
      # The existing metadata field that was used to validate this metadatum.
      metadata_field: m.metadata_field,
    }
  end

  def initiate_s3_prod_sync_to_staging
    return unless Rails.env == 'staging'

    from_path = "s3://idseq-samples-prod/#{sample_path}"
    to_path = "s3://idseq-samples-staging/#{sample_path}"
    Syscall.run("aws", "s3", "cp", "--recursive", from_path, to_path)
  end

  def private_until
    return created_at + project.days_to_keep_sample_private.days
  end

  # Get Metadata objects augmented with MetadataField.base_type
  def metadata_with_base_type
    metadata.map do |m|
      resp = m.attributes
      base_type = m.metadata_field.base_type

      # Special-case for locations (avoid extra call to #metadata_field.base_type in #validated_value)
      if base_type == MetadataField::LOCATION_TYPE
        resp["location_validated_value"] = m.location_id ? Location.find(m.location_id).attributes : m.string_validated_value
      end
      resp["base_type"] = MetadataField.convert_type_to_string(base_type)
      resp
    end
  end

  # Get field info for fields that are appropriate for both the project and the host genome
  def metadata_fields_info
    (project.metadata_fields & host_genome.metadata_fields).map(&:field_info)
  end

  # Explicit getter because we had issues with ":pipeline_runs, -> { order(created_at: :desc) }"
  # not being applied with the non-admin path in self.viewable when combined with an 'includes'.
  # Be careful when using this because it may cause an extra query for each of your samples!
  def first_pipeline_run
    pipeline_runs.order(created_at: :desc).first
  end

  # Gets the URL for the admin-only sample status page for printing in internal
  # error messages.
  def status_url
    UrlUtil.absolute_base_url + "/samples/#{id}/pipeline_runs"
  end

  def input_file_s3_paths
    input_files.map { |input_file| "s3://#{ENV['SAMPLES_BUCKET_NAME']}/#{input_file.file_path}" }
  end

  def self.search_by_name(query)
    if query
      tokens = query.scan(/\w+/).map { |t| "%#{t}%" }
      q = scoped
      tokens.each do |token|
        q = q.where("samples.name LIKE :search", search: token.to_s)
      end
      q
    else
      scoped
    end
  end
end
