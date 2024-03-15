require 'open3'
require 'json'
require 'tempfile'
require 'aws-sdk'
require 'elasticsearch/model'
# TODO(mark): Move to an initializer. Make sure this works with Rails auto-reloading.

class Sample < ApplicationRecord
  if ELASTICSEARCH_ON
    include Elasticsearch::Model
    # WARNING: using this means you must ensure activerecord callbacks are
    #  called on all updates. This module updates elasticsearch using these
    #  callbacks. If you must circumvent them somehow (eg. using raw SQL or
    #  bulk_import) you must explicitly update elasticsearch appropriately.
    include ElasticsearchCallbacksHelper
  end
  include AppConfigHelper
  include BasespaceHelper
  include ErrorHelper
  include MetadataHelper
  include PipelineOutputsHelper
  include PipelineRunsHelper
  include TestHelper
  extend ParameterSanitization

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
  has_many :workflow_runs, dependent: :destroy

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
  ] }

  validate :input_files_checks
  validates :name, presence: true, uniqueness: { scope: :project_id, case_sensitive: false }

  validates :web_commit, presence: true, allow_blank: true
  validates :pipeline_commit, presence: true, allow_blank: true
  validates :uploaded_from_basespace, presence: true, inclusion: { in: [0, 1] }
  validates :initial_workflow, inclusion: { in: WorkflowRun::WORKFLOW.values }

  before_save :check_host_genome, :concatenate_input_parts, :check_status
  after_create :initiate_input_file_upload
  before_destroy :cleanup_relations
  after_destroy :cleanup_s3

  delegate :consensus_genomes, to: :workflow_runs

  # Constants for upload_error field. NOTE: the name of this field is
  # inaccurate. The intention of the field is to carry a message (a constant
  # that refers to a message) to be shown to the user for exceptional
  # conditions. See app/assets/src/components/utils/sample.js
  UPLOAD_ERROR_BASESPACE_UPLOAD_FAILED = "BASESPACE_UPLOAD_FAILED".freeze
  UPLOAD_ERROR_S3_UPLOAD_FAILED = "S3_UPLOAD_FAILED".freeze
  UPLOAD_ERROR_MAX_FILE_SIZE_EXCEEDED = "MAX_FILE_SIZE_EXCEED".freeze
  UPLOAD_ERROR_LOCAL_UPLOAD_STALLED = "LOCAL_UPLOAD_STALLED".freeze
  UPLOAD_ERROR_LOCAL_UPLOAD_FAILED = "LOCAL_UPLOAD_FAILED".freeze
  UPLOAD_ERROR_PIPELINE_KICKOFF = "PIPELINE_KICKOFF_FAILED".freeze
  DO_NOT_PROCESS = "DO_NOT_PROCESS".freeze

  FINALIZED_UPLOAD_ERRORS = [
    UPLOAD_ERROR_BASESPACE_UPLOAD_FAILED,
    UPLOAD_ERROR_S3_UPLOAD_FAILED,
    UPLOAD_ERROR_MAX_FILE_SIZE_EXCEEDED,
    UPLOAD_ERROR_LOCAL_UPLOAD_FAILED,
    UPLOAD_ERROR_PIPELINE_KICKOFF,
    DO_NOT_PROCESS,
  ].freeze

  TOTAL_READS_JSON = "total_reads.json".freeze
  LOG_BASENAME = 'log.txt'.freeze

  LOCAL_INPUT_PART_PATH = '/app/tmp/input_parts'.freeze
  ASSEMBLY_DIR = 'assembly'.freeze

  # TODO: Make all these params configurable without code change
  DEFAULT_STORAGE_IN_GB = 1000
  DEFAULT_MEMORY_IN_MB = 120_000 # sorry, hacky
  HIMEM_IN_MB = 240_000

  DEFAULT_QUEUE = (Rails.env.prod? ? 'idseq-prod-lomem' : 'idseq-staging-lomem').freeze
  DEFAULT_VCPUS = 16

  DEFAULT_QUEUE_HIMEM = (Rails.env.prod? ? 'idseq-prod-himem' : 'idseq-staging-himem').freeze
  DEFAULT_VCPUS_HIMEM = 32

  METADATA_FIELDS = [:sample_notes].freeze

  SLEEP_SECONDS_BETWEEN_RETRIES = 10

  # Maximum allowed line length in characters for fastq/fasta files
  MAX_LINE_LENGTH = 10_000
  # Error message to identify parse errors from fastq-fasta-line-validation.awk
  PARSE_ERROR_MESSAGE = 'PARSE ERROR'.freeze
  # Script parameters
  FASTQ_FASTA_LINE_VALIDATION_AWK_SCRIPT = Rails.root.join("scripts", "fastq-fasta-line-validation.awk").to_s

  FILTERING_OPERATORS = [">=", "<="].freeze

  # Constants related to sorting
  DATA_KEY_TO_SORT_KEY = {
    "sample" => "name",
    "createdAt" => "id",
    "host" => "host",
    "totalReads" => "total_reads",
    "nonHostReads" => "adjusted_remaining_reads",
    "erccReads" => "total_ercc_reads",
    "pipelineVersion" => "pipeline_version",
    "subsampledFraction" => "fraction_subsampled",
    "qcPercent" => "qc_percent",
    "duplicateCompressionRatio" => "compression_ratio",
    "totalRuntime" => "time_to_finalized",
    "meanInsertSize" => "mean_insert_size",
  }.freeze
  SAMPLES_SORT_KEYS = ["name", "id"].freeze
  PIPELINE_RUNS_SORT_KEYS = ["total_reads", "adjusted_remaining_reads", "total_ercc_reads", "pipeline_version", "fraction_subsampled", "qc_percent", "compression_ratio", "time_to_finalized"].freeze
  TIEBREAKER_SORT_KEY = "id".freeze
  TAXON_FILTER_THRESHOLD_KEYS = [:count_type, :metric, :operator, :value].freeze

  scope :sort_by_metadata, lambda { |sort_key, order_dir|
    # Note: if the samples do not contain the specified metadata, all metadata.string_validated_value's will be nil
    # and samples will be sorted by TIEBREAKER_SORT_KEY
    joins_statement = "LEFT JOIN metadata ON (samples.id = metadata.sample_id AND metadata.key = '#{sort_key}')"
    order_statement = "metadata.string_validated_value #{order_dir}, samples.#{TIEBREAKER_SORT_KEY} #{order_dir}"
    joins(ActiveRecord::Base.sanitize_sql_array(joins_statement)).order(ActiveRecord::Base.sanitize_sql_array(order_statement))
  }

  scope :sort_by_location, lambda { |order_dir|
    joins_statement = "
      LEFT JOIN metadata ON (samples.id = metadata.sample_id AND metadata.key = 'collection_location_v2')
      LEFT JOIN locations ON metadata.location_id = locations.id
    "
    # TODO(ihan): Investigate location metadata creation. I've implemented a workaround solution below,
    # but ideally, all location info should be stored by location_id.
    order_statement = "(CASE WHEN ISNULL(metadata.location_id) THEN metadata.string_validated_value ELSE locations.name END) #{order_dir}, samples.#{TIEBREAKER_SORT_KEY} #{order_dir}"
    joins(joins_statement).order(Arel.sql(ActiveRecord::Base.sanitize_sql_array(order_statement)))
  }

  scope :sort_by_host_genome, lambda { |order_dir|
    order_statement = "host_genomes.name #{order_dir}, samples.#{TIEBREAKER_SORT_KEY} #{order_dir}"
    left_outer_joins(:host_genome).order(Arel.sql(ActiveRecord::Base.sanitize_sql_array(order_statement)))
  }

  scope :sort_by_pipeline_run, lambda { |sort_key, order_dir|
    # join on each sample's most-recent pipeline run
    joins_statement = "
      LEFT JOIN pipeline_runs ON samples.id = pipeline_runs.sample_id AND
      pipeline_runs.id = (SELECT MAX(id) FROM pipeline_runs WHERE samples.id = pipeline_runs.sample_id)
    "
    order_statement = "pipeline_runs.#{sort_key} #{order_dir}, samples.#{TIEBREAKER_SORT_KEY} #{order_dir}"
    joins(joins_statement).order(Arel.sql(ActiveRecord::Base.sanitize_sql_array(order_statement)))
  }

  scope :sort_by_insert_size, lambda { |order_dir|
    # join on each sample's most-recent pipeline run
    joins_statement = "
      LEFT JOIN pipeline_runs ON samples.id = pipeline_runs.sample_id AND
      pipeline_runs.id = (SELECT MAX(id) FROM pipeline_runs WHERE samples.id = pipeline_runs.sample_id)
      LEFT JOIN insert_size_metric_sets ON insert_size_metric_sets.pipeline_run_id = pipeline_runs.id
    "
    order_statement = "insert_size_metric_sets.mean #{order_dir}, samples.#{TIEBREAKER_SORT_KEY} #{order_dir}"
    joins(joins_statement).order(Arel.sql(ActiveRecord::Base.sanitize_sql_array(order_statement)))
  }

  # "Get all samples created in a particular week": Sample.by_time(start_date: Date.parse("20220620"), end_date: Date.parse("20220624"))
  scope :by_time, ->(start_date:, end_date:) { where(created_at: start_date.beginning_of_day..end_date.end_of_day) }
  # "Get all samples that failed" : Sample.by_pipeline_result_status(results_finalized: PipelineRun::FINALIZED_FAIL)
  # Get all failed samples within a particular week: Sample.by_time(start_date: Date.parse("20220620"), end_date: Date.parse("20220624")).by_pipeline_result_status(results_finalized: PipelineRun::FINALIZED_FAIL)
  scope :by_pipeline_result_status, ->(results_finalized:) { joins(:pipeline_runs).where(pipeline_runs: { deprecated: false, results_finalized: results_finalized }) }

  scope :non_deleted, -> { where(deleted_at: nil) }

  # These are temporary variables that are not saved to the database. They only persist for the lifetime of the Sample object.
  attr_accessor :bulk_mode, :basespace_dataset_id

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
    pipeline_runs.non_deleted.left_joins(:taxon_counts, :alignment_config).order(created_at: :desc).distinct.each do |pr|
      prvs[pr.pipeline_version] ||= {
        id: pr.id,
        pipeline_version: pr.pipeline_version,
        wdl_version: pr.wdl_version,
        created_at: pr.created_at,
        alignment_config_name: pr.alignment_config.name,
        assembled: pr.assembled.to_i,
        adjusted_remaining_reads: pr.adjusted_remaining_reads,
        total_ercc_reads: pr.total_ercc_reads,
        run_finalized: pr.finalized?,
      }
    end
    prvs.values
  end

  def workflow_runs_info
    workflow_runs_info = []
    workflow_runs.non_deprecated.non_deleted.reverse_each do |wr|
      wr_info = wr.as_json(
        only: WorkflowRun::DEFAULT_FIELDS,
        methods: [:input_error, :inputs, :parsed_cached_results]
      )
      wr_info["run_finalized"] = wr.finalized?
      workflow_runs_info << wr_info
    end
    workflow_runs_info
  end

  def fasta_input?
    ["fasta", "fa", "fasta.gz", "fa.gz"].include?(input_files[0].file_extension)
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
    input_fastqs = input_files.select { |file| file.file_type == InputFile::FILE_TYPE_FASTQ }

    # validate that we have the correct number of input fastq files
    errors.add(:input_fastqs, "invalid number (#{input_fastqs.size})") unless
      # we can have up to 4 input files, input fasta R1 + R2, a primer bed for consensus genomes,
      #  and a reference fasta for consensus genomes. We currently don't support this from basespace
      uploaded_from_basespace? ? input_fastqs.size.between?(0, 2) : input_fastqs.size.between?(1, 4)

    # validate that both input fastq files have the same source_type and file_extension
    if input_fastqs.length == 2
      errors.add(:input_fastqs, "have different source types") unless input_fastqs[0].source_type == input_fastqs[1].source_type
      errors.add(:input_fastqs, "have different file formats") unless input_fastqs[0].file_extension == input_fastqs[1].file_extension
      if input_fastqs[0].source == input_fastqs[1].source
        errors.add(:input_fastqs, "have identical read 1 source and read 2 source")
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
      LogUtil.log_error("AWS presign error: #{e.inspect}", exception: e, s3key: s3key)
    end
    nil
  end

  def self.owned_by_user(user)
    where(user_id: user.id)
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
    prefix = s3_path.split("#{SAMPLES_BUCKET_NAME}/")[1]

    # Adding pagination to fix a bug where there are too many files for step function pipelines
    # TODO: A better solution should be planned as part of https://jira.czi.team/browse/IDSEQ-2295
    outputs = []
    AwsClient[:s3].list_objects_v2(
      bucket: SAMPLES_BUCKET_NAME,
      prefix: "#{prefix}/",
      delimiter: delimiter
    ).each do |resp|
      outputs += resp.contents.map do |f|
        {
          key: f.key,
          display_name: end_path(f.key, display_prefix),
          url: Sample.get_signed_url(f.key),
          size: ActiveSupport::NumberHelper.number_to_human_size(f.size),
        }
      end
    end
    return outputs
  end

  def results_folder_files(pipeline_version = nil)
    pr = pipeline_version ? pipeline_run_by_version(pipeline_version) : first_pipeline_run
    return list_outputs(sample_output_s3_path) unless pr

    file_list = []
    if pipeline_version_at_least_2(pr.pipeline_version)
      if pr.step_function?
        file_list = list_outputs(pr.sfn_results_path)
      else
        file_list = list_outputs(pr.output_s3_path_with_version)
        file_list += list_outputs(sample_output_s3_path)
        file_list += list_outputs(pr.postprocess_output_s3_path)
        file_list += list_outputs(pr.postprocess_output_s3_path + '/' + ASSEMBLY_DIR)
        file_list += list_outputs(pr.expt_output_s3_path)
      end
    else
      stage1_files = list_outputs(pr.host_filter_output_s3_path)
      stage2_files = list_outputs(pr.alignment_output_s3_path, 2)
      file_list = stage1_files + stage2_files
    end
    file_list
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

  def initiate_fastq_files_s3_cp(unlimited_size = false)
    return unless status == STATUS_CREATED

    self.upload_error = nil
    stderr_array = []
    total_reads_json_path = nil
    # The AppConfig setting is the max file size in gigabytes; default 100; multiply by 10^9 to get bytes
    s3_upload_file_size_limit = (get_app_config(AppConfig::S3_SAMPLE_UPLOAD_FILE_SIZE_LIMIT) || 100).to_i
    max_file_size = s3_upload_file_size_limit * (10**9)
    input_fastqs = input_files.fastq
    input_fastqs.each do |input_file|
      fastq = input_file.source
      total_reads_json_path = File.join(File.dirname(fastq.to_s), TOTAL_READS_JSON)
      # get bucket and key
      bucket, key = S3Util.parse_s3_path(fastq)
      # determine the file size
      unless unlimited_size
        input_file_size = S3Util.get_file_size(bucket, key)
        if input_file_size > max_file_size
          self.upload_error = Sample::UPLOAD_ERROR_MAX_FILE_SIZE_EXCEEDED
          raise SampleUploadErrors.max_file_size_exceeded(input_file_size, max_file_size)
        end
      end
      # Retry s3 cp up to 3 times
      max_tries = 3
      try = 0
      while try < max_tries
        _stdout, stderr, status = Open3.capture3(
          "aws", "s3", "cp", fastq, "#{sample_input_s3_path}/#{input_file.name}"
        )
        if status.success?
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

    if user.allowed_feature?("create_next_gen_entities")
      # Link uploaded files and kickoff workflow in workflows service
      if workflow_runs.any? { |wr| wr.workflow == WorkflowRun::WORKFLOW[:consensus_genome] }
        SampleFileEntityLinkCreationService.call(user.id, self)
      end
    end
  rescue StandardError => e
    LogUtil.log_error(
      "SampleUploadFailedEvent: Failed to upload S3 sample '#{name}' (#{id}): #{e}",
      exception: e,
      sample_name: name,
      sample_id: id
    )
    self.status = STATUS_CHECKED
    if upload_error.blank?
      self.upload_error = Sample::UPLOAD_ERROR_S3_UPLOAD_FAILED
    end
    WorkflowRun.handle_sample_upload_failure(self)
    save!
  end

  # Uploads input fastq files from basespace for this sample.
  # basespace_dataset_id is the id of the dataset from basespace we are uploading samples from.
  #   A dataset is a basespace concept meaning a collection of one or more related files (such as paired fastq files)
  # basespace_access_token is the access token that authorizes us to download these files.
  def transfer_basespace_fastq_files(basespace_dataset_id, basespace_access_token)
    # Only continue if the sample status is CREATED and not yet UPLOADED.
    return unless status == STATUS_CREATED

    # If we have comma-separated datasets IDs, that represents the IDs of lanes we want to concatenate
    basespace_dataset_ids = basespace_dataset_id.split(",")
    should_concat_lanes = basespace_dataset_ids.size > 1

    # Combine URLs for the lanes we want to concatenate
    files_concat = []
    basespace_dataset_ids.each_with_index do |dataset_id, dataset_index|
      files = files_for_basespace_dataset(dataset_id, basespace_access_token)

      # Raise error if fetching the files failed, or we fetched zero files (since we can't proceed with zero files)
      raise SampleUploadErrors.error_fetching_basespace_files_for_dataset(dataset_id, name, id) if files.nil?
      raise SampleUploadErrors.no_files_in_basespace_dataset(dataset_id, name, id) if files.empty?

      # Concatenate each read pair separately (i.e. R1 lanes separately from R2 lanes)
      files.each_with_index do |file, read_index|
        # The first time, we need to initialize the object
        if dataset_index == 0
          # If we're concatenating multiple lanes, remove the lane number from the file name
          file_name = should_concat_lanes ? file[:name].sub(/_L00[1-8]/, "") : file[:name]
          files_concat[read_index] = {
            name: file_name,
            source_path: file[:source_path],
            download_path: [file[:download_path]],
          }
        # Otherwise, just append
        else
          files_concat[read_index][:source_path] << "," << file[:source_path]
          files_concat[read_index][:download_path].push(file[:download_path])
        end
      end
    end

    # Retry uploading three times, in case of transient network failures.
    files_concat.each do |file|
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
        source: file[:source_path],
        upload_client: InputFile::UPLOAD_CLIENT_WEB,
        file_type: InputFile::FILE_TYPE_FASTQ
      )

      input_files << input_file
    end

    self.status = STATUS_UPLOADED
    save!
  rescue StandardError => e
    Rails.logger.info(e)
    LogUtil.log_error(
      "SampleUploadFailedEvent: #{e}",
      exception: e,
      basespace_dataset_id: basespace_dataset_id,
      basespace_access_token: basespace_access_token
    )

    self.status = STATUS_CHECKED
    self.upload_error = Sample::UPLOAD_ERROR_BASESPACE_UPLOAD_FAILED
    WorkflowRun.handle_sample_upload_failure(self)

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

  def skip_deutero_filter_flag
    !host_genome || host_genome.skip_deutero_filter == 1 ? 1 : 0
  end

  def sample_output_s3_path
    "s3://#{ENV['SAMPLES_BUCKET_NAME']}/#{sample_path}/results"
  end

  def sample_host_filter_output_s3_path
    pr = first_pipeline_run
    return pr.host_filter_output_s3_path
  rescue StandardError
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
    # If the background of the host genome is not present, use Human HostGenome default background
    host_genome&.default_background_id.present? ? host_genome.default_background_id : HostGenome.find_by(name: "Human").default_background_id
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
    rescue StandardError
      LogUtil.log_error("Failed to concatenate input parts for sample #{id}", sample_id: id)
    end
  end

  def check_status
    return unless [STATUS_UPLOADED, STATUS_RERUN, STATUS_RETRY_PR].include?(status)

    pr = first_pipeline_run
    transient_status = status
    self.status = STATUS_CHECKED

    # Since this method is called in `before_save` hook, if there is any errors,
    # the pipeline run / workflow run creation is rolled back, leaving the sample in a weird waiting state.
    # TODO: Support retry status on WorkflowRuns
    amr_wrs_to_dispatch = workflow_runs.where(status: WorkflowRun::STATUS[:created], workflow: WorkflowRun::WORKFLOW[:amr])
    cg_wrs_to_dispatch =  workflow_runs.where(status: WorkflowRun::STATUS[:created], workflow: WorkflowRun::WORKFLOW[:consensus_genome])
    if transient_status == STATUS_RETRY_PR && pr
      pr.retry
    elsif initial_workflow == WorkflowRun::WORKFLOW[:consensus_genome]
      cg_wrs_to_dispatch.all.map(&:dispatch)
    elsif initial_workflow == WorkflowRun::WORKFLOW[:amr]
      amr_wrs_to_dispatch.all.map(&:dispatch)
    elsif initial_workflow == WorkflowRun::WORKFLOW[:short_read_mngs]
      kickoff_pipeline
      amr_wrs_to_dispatch.all.map(&:dispatch) unless amr_wrs_to_dispatch.empty?
      cg_wrs_to_dispatch.all.map(&:dispatch) unless cg_wrs_to_dispatch.empty?
    elsif initial_workflow == WorkflowRun::WORKFLOW[:long_read_mngs]
      if transient_status == STATUS_RERUN
        # If we're rerunning an existing long read mngs sample, we need to create a new pipeline run to dispatch.
        alignment_config_name = VersionRetrievalService.call(project_id, AlignmentConfig::NCBI_INDEX)

        new_pr = PipelineRun.new(
          sample: self,
          technology: PipelineRun::TECHNOLOGY_INPUT[:nanopore],
          guppy_basecaller_setting: pr.guppy_basecaller_setting,
          alignment_config: AlignmentConfig.find_by(name: alignment_config_name)
        )
        mark_older_pipeline_runs_as_deprecated if new_pr.save!
        new_pr.dispatch
      else
        # If this a new sample, just dispatch the pipeline run that was created on upload in SamplesHelper#upload_samples_with_metadata.
        pr.dispatch
      end
    end
  end

  def create_and_dispatch_workflow_run(workflow, user_id, rerun_from: nil, inputs_json: nil)
    workflow_run = WorkflowRun.create(sample: self, workflow: workflow, user_id: user_id, rerun_from: rerun_from, inputs_json: inputs_json)
    workflow_run.dispatch
    workflow_run
  end

  def copy_to_project(new_project, copy_s3 = false)
    # if project is the same as the current project, raise error
    if project.id == new_project.id
      raise "Projects can't be the same"
    end

    duplicate_sample = deep_clone include: [:metadata, :input_files] do |original, copy|
      # Not ideal, but we keep original creation timestamp as it is used to infer uploading timestamp
      copy.created_at = original.created_at
    end
    duplicate_sample.project = new_project
    duplicate_sample.input_files.each do |input_file|
      input_file.source_type = InputFile::SOURCE_TYPE_LOCAL
      input_file.upload_client = InputFile::UPLOAD_CLIENT_WEB
    end
    if duplicate_sample.valid?
      duplicate_sample.save!
    end

    begin
      copy_pipeline_runs_to_sample(duplicate_sample, copy_s3)
      copy_workflow_runs_to_sample(duplicate_sample, copy_s3)
    rescue StandardError => error
      # Destroy the duplicate sample if there was an error
      duplicate_sample.destroy!
      raise error
    end
    duplicate_sample
  end

  def copy_pipeline_runs_to_sample(new_sample, copy_s3 = false)
    pipeline_runs.each do |pr|
      next if pr.deprecated # don't copy deprecated pipelines

      new_pr = pr.deep_clone include: [
        :taxon_counts,
        :job_stats,
        :output_states,
        :taxon_byteranges,
        :ercc_counts,
        :amr_counts,
        :contigs,
        :pipeline_run_stages,
        :accession_coverage_stats,
        :insert_size_metric_set,
        :annotations,
      ] do |original, copy|
        copy.created_at = original.created_at
      end
      new_pr.sample_id = new_sample.id
      new_pr.save!
      duplicate_pipeline_run_s3(new_sample, pr, new_pr) if copy_s3
    end
  end

  def copy_workflow_runs_to_sample(new_sample, copy_s3 = false)
    workflow_runs.each do |wr|
      next if wr.deprecated # don't copy deprecated workflows

      new_wr = wr.deep_clone do |original, copy|
        copy.created_at = original.created_at
      end
      new_wr.sample_id = new_sample.id
      new_wr.save!
      duplicate_pipeline_run_s3(new_sample, wr, new_wr) if copy_s3
    end
  end

  def list_objects(s3_path, continuation_token = nil, delimiter = "/")
    prefix = s3_path.split("#{SAMPLES_BUCKET_NAME}/")[1]
    AwsClient[:s3].list_objects_v2(
      bucket: SAMPLES_BUCKET_NAME,
      prefix: "#{prefix}/",
      continuation_token: continuation_token,
      delimiter: delimiter
    )
  end

  def duplicate_pipeline_run_s3(new_sample, old_pr, new_pr)
    bucket = Aws::S3::Bucket.new(ENV['SAMPLES_BUCKET_NAME'])
    new_pr.update(s3_output_prefix: "s3://#{ENV['SAMPLES_BUCKET_NAME']}/#{new_sample.sample_path}/#{new_pr.id}")
    Rails.logger.info("duplicating s3 bucket #{new_pr.s3_output_prefix}")

    continuation_token = nil

    begin
      loop do
        objects = list_objects(old_pr.sfn_results_path, continuation_token = continuation_token)
        Rails.logger.info("number of objects: #{objects.contents.count}")
        objects.contents.each do |object|
          source_object = bucket.object(object[:key])
          target_bucket, target_key = S3Util.parse_s3_path("#{new_pr.sfn_results_path}/#{File.basename(object[:key])}")
          if source_object.size < 5_242_880 # 5MB
            source_object.copy_to(bucket: target_bucket, key: target_key, multipart_copy: false)
          else
            source_object.copy_to(bucket: target_bucket, key: target_key, multipart_copy: true)
          end
        end
        continuation_token = objects.next_continuation_token
        Rails.logger.info("objects is truncated?: #{objects.is_truncated}")

        break unless objects.is_truncated
      end
    rescue StandardError => e
      raise e
    end
  end

  # Delay determined based on query of historical upload times, where 80%
  # of successful uploads took less than 3 hours by updated time.
  def self.current_stalled_local_uploads(delay = 3.hours)
    where(status: STATUS_CREATED)
      .where("samples.created_at < ?", Time.now.utc - delay)
      .joins(:input_files)
      .where(input_files: { source_type: InputFile::SOURCE_TYPE_LOCAL })
      .distinct
  end

  def cleanup_relations
    input_files.delete_all
    metadata.delete_all
  end

  def cleanup_s3
    S3Util.delete_s3_prefix("s3://#{ENV['SAMPLES_BUCKET_NAME']}/#{sample_path}/")
  end

  def self.viewable(user)
    if user.nil?
      Sample.none
    elsif user.admin?
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
    if user.nil?
      nil
    elsif user.admin?
      all
    else
      my_data(user)
    end
  end

  def self.my_data(user)
    project_ids = user.projects.pluck(:id)
    where("project_id in (?)", project_ids)
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

  # Kickoff short read mngs pipeline
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
    pr.pipeline_branch = pipeline_branch.presence || "master"
    pr.pipeline_execution_strategy = PipelineRun.pipeline_execution_strategies[:step_function]
    pr.dag_vars = dag_vars if dag_vars
    pr.pipeline_commit = Sample.pipeline_commit(pr.pipeline_branch)

    # use admin-supplied alignment config or fetch the pinned alignment config for the project
    alignment_config_name_for_pr = alignment_config_name || VersionRetrievalService.call(project_id, AlignmentConfig::NCBI_INDEX)
    pr.alignment_config = AlignmentConfig.find_by(name: alignment_config_name_for_pr)

    pr.technology = PipelineRun::TECHNOLOGY_INPUT[:illumina]
    mark_older_pipeline_runs_as_deprecated if pr.save!

    # If async notifications are enabled for mNGS, we dispatch the pipeline run as soon as it's created,
    # since it won't be kicked off by PipelineMonitor.
    if AppConfigHelper.get_app_config(AppConfig::ENABLE_SFN_NOTIFICATIONS) == "1"
      prs = pr.active_stage
      if prs && !prs.started? && prs.step_number == 1
        pr.dispatch
        prs.run_job
      end
    end
  rescue StandardError => err
    LogUtil.log_error("Error saving pipeline run: #{err.inspect}", exception: err)
    # This may cause a message to be shown to the user on the sample page.
    # This may cause a message to be shown to the user on the sample page.
    # See app/assets/src/components/utils/sample.js
    # HACK ALERT! Use low-level update_columns to avoid callbacks, because
    # kickoff_pipeline may be running in a callback already.
    update_columns(upload_error: Sample::UPLOAD_ERROR_PIPELINE_KICKOFF) # rubocop:disable Rails/SkipsModelValidations
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
    if m.blank?
      if val.blank?
        return {
          metadatum: nil,
          status: "ok",
        }
      end
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
    return unless Rails.env.staging?

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

  def first_workflow_run(workflow_name)
    workflow_runs.where(workflow: workflow_name, deprecated: false).order(executed_at: :desc).first
  end

  # Gets the URL for the admin-only sample status page for printing in internal
  # error messages.
  def status_url
    UrlUtil.absolute_base_url + "/samples/#{id}/pipeline_runs"
  end

  def input_file_s3_paths(file_type = nil)
    files = file_type ? input_files.by_type(file_type) : input_files
    files.map { |input_file| "s3://#{ENV['SAMPLES_BUCKET_NAME']}/#{input_file.file_path}" }
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

  def move_to_project(new_project_id)
    new_sample_path = File.join('samples', new_project_id.to_s, id.to_s)
    Syscall.s3_mv_recursive("s3://#{ENV['SAMPLES_BUCKET_NAME']}/#{sample_path}/", "s3://#{ENV['SAMPLES_BUCKET_NAME']}/#{new_sample_path}/")
    update(project_id: new_project_id)
  end

  # order_by stores a sortable column's dataKey (refer to: ColumnConfigurations.jsx)
  def self.sort_samples(samples, order_by, order_dir)
    sort_key = DATA_KEY_TO_SORT_KEY[order_by.to_s]
    metadata_sort_key = sanitize_metadata_field_name(order_by)

    if SAMPLES_SORT_KEYS.include?(sort_key)
      samples.order("samples.#{sort_key} #{order_dir}, samples.#{TIEBREAKER_SORT_KEY} #{order_dir}")
    elsif sort_key == "host"
      samples.sort_by_host_genome(order_dir)
    elsif PIPELINE_RUNS_SORT_KEYS.include?(sort_key)
      samples.sort_by_pipeline_run(sort_key, order_dir)
    elsif sort_key == "mean_insert_size"
      samples.sort_by_insert_size(order_dir)
    elsif sort_key == "collection_location_v2"
      samples.sort_by_location(order_dir)
    elsif metadata_sort_key.present?
      samples.sort_by_metadata(metadata_sort_key, order_dir)
    else
      samples
    end
  end

  def self.group_taxon_count_filters_by_count_type(threshold_filter_info)
    # Convert threshold hash into a filter statement and group it by count types (nt or nr)
    filters_by_count_type = threshold_filter_info.each_with_object({}) do |threshold_filter, result|
      count_type, metric, operator, value = *threshold_filter.fetch_values(*TAXON_FILTER_THRESHOLD_KEYS)
      uppercase_count_type = count_type.upcase
      value = Float(value)

      filter_statement = TaxonCount.arel_table[metric]
      filter_statement = operator == ">=" ? filter_statement.gteq(value) : filter_statement.lteq(value)
      if result[uppercase_count_type].nil?
        result[uppercase_count_type] = [filter_statement.to_sql]
      else
        result[uppercase_count_type] << filter_statement.to_sql
      end
    end

    filters_by_count_type
  end

  # threshold_filter_info is an array of JSON strings that need to be parsed
  def self.filter_by_taxon_count_threshold(tax_ids, threshold_filter_info)
    threshold_filters_by_count_type = group_taxon_count_filters_by_count_type(threshold_filter_info)

    queries_by_count_type = threshold_filters_by_count_type.each_with_object({}) do |(count_type, filter_queries), queries|
      filter_statement = filter_queries.join(" AND ")
      sanitized_filter_statement = ActiveRecord::Base.sanitize_sql_array(["(`taxon_counts`.`count_type` = '#{count_type}' AND #{filter_statement})"])
      # TODO: Test out creating new composite index (pipeline_run_id, count_type, tax_id)
      left_join_statement = "LEFT OUTER JOIN `pipeline_runs` ON `pipeline_runs`.`sample_id` = `samples`.`id` LEFT OUTER JOIN `taxon_counts` FORCE INDEX FOR JOIN (`index_pr_tax_hit_level_tc`) ON `taxon_counts`.`pipeline_run_id` = `pipeline_runs`.`id`"
      queries[count_type] = joins(left_join_statement).where(
        pipeline_runs: {
          deprecated: false,
        },
        taxon_counts: {
          tax_id: tax_ids,
        }
      ).where(Arel.sql(sanitized_filter_statement))
    end

    query = case queries_by_count_type.keys
            when [TaxonCount::COUNT_TYPE_NT, TaxonCount::COUNT_TYPE_NR], [TaxonCount::COUNT_TYPE_NR, TaxonCount::COUNT_TYPE_NT]
              queries_by_count_type[TaxonCount::COUNT_TYPE_NT].or(queries_by_count_type[TaxonCount::COUNT_TYPE_NR])
            when [TaxonCount::COUNT_TYPE_NT]
              queries_by_count_type[TaxonCount::COUNT_TYPE_NT]
            when [TaxonCount::COUNT_TYPE_NR]
              queries_by_count_type[TaxonCount::COUNT_TYPE_NR]
            end
    # Perform a `where` operation here to return a basic ActiveRecord query to avoid sorting errors that would otherwise
    # be caused if we just returned the query due to issues when double joining on pipeline runs in sorting queries and using `order_by` with `distinct`
    where(id: query.distinct)
  end

  def self.filter_by_contig_threshold(tax_ids_with_levels, contig_threshold_filters)
    queries = contig_threshold_filters.each_with_object([]) do |filter, result|
      count_type, metric, operator, value = *filter.fetch_values(*TAXON_FILTER_THRESHOLD_KEYS)

      tax_ids_with_levels.each do |tax_id, tax_level|
        contig_filter_statement = create_contig_filter_statement(metric, tax_id, tax_level, count_type, operator, value)
        result << left_outer_joins(pipeline_runs: [:contigs]).where(pipeline_runs: { deprecated: false }).where(contig_filter_statement).distinct.to_sql
      end
    end

    # Execute raw SQL then convert the results back to an active record relation
    # TODO: Find a better way to do the union of multiple ActiveRecord::Relation and return an ActiveRecord::Relation
    filtered_sample_ids = Sample.find_by_sql(queries.join(" UNION ")).pluck(:id)
    Sample.where(id: filtered_sample_ids)
  end

  def self.create_contig_filter_statement(metric, tax_id, tax_level, count_type, operator, value)
    contig_arel_table = Contig.arel_table
    lowercase_count_type = count_type.downcase

    filter_statement = contig_arel_table.where(contig_arel_table["#{tax_level}_taxid_#{lowercase_count_type}"].eq(tax_id))
    filter_statement = filter_statement.where(PipelineRun.arel_table[:id].eq(contig_arel_table[:pipeline_run_id]))
    filter_statement = add_aggregate_arel_node_for_contig_metric(filter_statement, metric, operator, value)

    filter_statement.to_sql
  end

  def self.add_aggregate_arel_node_for_contig_metric(arel_query, metric, operator, value)
    contig_arel_table = Contig.arel_table

    case metric
    when "contigs"
      arel_aggregate_statement_node = Arel.star.count
    when "contig_r"
      arel_aggregate_statement_node = contig_arel_table[:read_count].sum
    end

    arel_having_node = operator == ">=" ? arel_aggregate_statement_node.gteq(value) : arel_aggregate_statement_node.lteq(value)
    query = arel_query.group(contig_arel_table[:pipeline_run_id]).project(arel_aggregate_statement_node).having(arel_having_node)

    query
  end

  private

  def mark_older_pipeline_runs_as_deprecated
    # If the sample has more than one pipeline run, set deprecated to true for all other pipeline runs except the first.
    # Pipeline Runs are sorted by created_at: desc by default when accessing a sample's pipeline runs via `sample.pipeline_runs`
    pipeline_runs.each_with_index do |pr, index|
      pr.update(deprecated: true) if index != 0
    end
  end
end
