require 'yaml'

class WorkflowRun < ApplicationRecord
  # WorkflowRun model manages the run of a generic workflow type through our
  # pipeline and access to the results.
  #
  # WorkflowRun includes a *deprecated* attribute. Notes on deprecation:
  # * Deprecated runs are runs that were rerun, and superseded by other runs.
  # * Deprecated runs make it easier to select active runs (`where(deprecated:
  #   false)`), as opposed to having to sort by execution.
  # * The benefits are even more obvious if we start supporting multiple
  #   workflow runs per sample. In that case, the date of execution would not be
  #   enough to identify valid runs.
  # * For views that require all the versions, the deprecated field can be
  #   ignored. The wdl_version and executed_at fields might be used to select
  #   the relevant runs in that case.
  #
  # Why keep deprecated runs at all?
  # * Main reason is for comparing before-and-after a rerun (e.g. seeing if a
  #   failed sample will now succeed, or seeing that a successful sample now
  #   fails, or comparing results before-and-after an index update). We just
  #   need somewhere to track the inputs, attributes, and log links, and the
  #   model record is a natural place.
  #
  # Why are reruns "idempotent" (creating new runs) instead of in-place
  # (updating the existing run)?
  # * It's easier to compare results with their full history and logs (e.g.
  #   seeing what changed).
  # * In-replace reruns often lead to trouble when only some fields are reset
  #   and not others, or inputs change subtly between reruns. For example this
  #   could happen in the context of S3 if old intermediate files are actually
  #   'dirty' and can't be reused. Another case could be if some statistic
  #   columns are updated but not others. This can be avoided by making sure to
  #   really reset everything, but in that case may as well create a new record.
  #
  # What should go into inputs_json?
  # * Include any WDL inputs that affect the results, but don't include other
  #   informational attributes like a sample ID. Secret fields should also not belong here.
  #
  # What should go into cached_results?
  # * Include simple outputs that you need to load quickly in a batch of runs.
  #   Don't include larger file-based outputs or outputs that can be loaded from
  #   S3 on-demand.
  include PipelineOutputsHelper
  extend ParameterSanitization

  belongs_to :sample
  before_destroy :cleanup_s3

  WORKFLOW = {
    # NOTE: 'main' is not yet supported in WorkflowRuns.
    main: "main",
    amr: "amr",
    consensus_genome: "consensus-genome",
    short_read_mngs: "short-read-mngs",
    long_read_mngs: "long-read-mngs",
  }.freeze

  WORKFLOW_CLASS = {
    WORKFLOW[:consensus_genome] => ConsensusGenomeWorkflowRun,
    WORKFLOW[:amr] => AmrWorkflowRun,
  }.freeze

  MNGS_WORKFLOWS = [
    WORKFLOW[:short_read_mngs],
    WORKFLOW[:long_read_mngs],
  ].freeze

  MNGS_WORKFLOW_TO_TECHNOLOGY = {
    WORKFLOW[:short_read_mngs] => PipelineRun::TECHNOLOGY_INPUT[:illumina],
    WORKFLOW[:long_read_mngs] => PipelineRun::TECHNOLOGY_INPUT[:nanopore],
  }.freeze

  SHORT_READ_MNGS_METRICS = [
    { text: "NT rPM", value: "NT.rpm" },
    { text: "NT Z Score", value: "NT.zscore" },
    { text: "NT r (total reads)", value: "NT.r" },
    { text: "NR rPM", value: "NR.rpm" },
    { text: "NR Z Score", value: "NR.zscore" },
    { text: "NR r (total reads)", value: "NR.r" },
    { text: "NT %id", value: "NT.percentidentity" },
    { text: "NT L (alignment length in bp)", value: "NT.alignmentlength" },
    { text: "NT E Value", value: "NT.logevalue" },
    { text: "NR %id", value: "NR.percentidentity" },
    { text: "NR L (alignment length in bp)", value: "NR.alignmentlength" },
    { text: "NR E Value", value: "NR.logevalue" },
  ].freeze
  LONG_READ_MNGS_METRICS = [
    { text: "NT bPM", value: "NT.bpm" },
    { text: "NT b (total bases)", value: "NT.b" },
    { text: "NT r (total reads)", value: "NT.r" },
    { text: "NR bPM", value: "NR.bpm" },
    { text: "NR b (total bases)", value: "NR.b" },
    { text: "NR r (total reads)", value: "NR.r" },
    { text: "NT %id", value: "NT.percentidentity" },
    { text: "NT L (alignment length in bp)", value: "NT.alignmentlength" },
    { text: "NT E Value", value: "NT.logevalue" },
    { text: "NR %id", value: "NR.percentidentity" },
    { text: "NR L (alignment length in bp)", value: "NR.alignmentlength" },
    { text: "NR E Value", value: "NR.logevalue" },
  ].freeze
  WORKFLOW_METRICS = {
    WORKFLOW[:short_read_mngs] => SHORT_READ_MNGS_METRICS,
    WORKFLOW[:long_read_mngs] => LONG_READ_MNGS_METRICS,
  }.freeze

  STATUS = {
    created: "CREATED",
    running: "RUNNING",
    succeeded: "SUCCEEDED",
    succeeded_with_issue: "SUCCEEDED_WITH_ISSUE",
    failed: "FAILED",
    timed_out: "TIMED_OUT",
    aborted: "ABORTED",
  }.freeze

  # Maps SFN execution statuses to classic frontend statuses
  SFN_STATUS_MAPPING = {
    STATUS[:created] => "CREATED",
    STATUS[:running] => "RUNNING",
    STATUS[:succeeded] => "COMPLETE",
    STATUS[:succeeded_with_issue] => "COMPLETE - ISSUE",
    STATUS[:failed] => "FAILED",
  }.freeze

  FAILED_REMOTE_STATUSES = [
    STATUS[:failed],
    STATUS[:timed_out],
    STATUS[:aborted],
  ].freeze

  INPUT_ERRORS = {
    "InvalidInputFileError" => "There was an error parsing one of the input files.",
    "InsufficientReadsError" => "The number of reads after filtering was insufficient for further analysis.",
    "BrokenReadPairError" => "There were too many discordant read pairs in the paired-end sample.",
    "InvalidFileFormatError" => "The input file you provided has a formatting error in it.",
  }.freeze

  TOTAL_READS_KEY = "total_reads".freeze
  QC_PERCENT_KEY = "qc_percent".freeze
  REMAINING_READS_KEY = "adjusted_remaining_reads".freeze
  PERCENT_REMAINING_KEY = "percent_remaining".freeze
  COMPRESSION_RATIO_KEY = "compression_ratio".freeze
  TOTAL_ERCC_READS_KEY = "total_ercc_reads".freeze
  SUBSAMPLED_FRACTION_KEY = "fraction_subsampled".freeze
  INSERT_SIZE_MEAN_KEY = "insert_size_mean".freeze
  INSERT_SIZE_STD_DEV_KEY = "insert_size_standard_deviation".freeze

  # Constants related to sorting
  DATA_KEY_TO_SORT_KEY = {
    "sample" => "name",
    "createdAt" => "id",
    "host" => "host",
    "referenceAccession" => "accession_id",
    "wetlabProtocol" => "wetlab_protocol",
    "technology" => "technology",
    "medakaModel" => "medaka_model",
    "totalReadsCG" => "total_reads",
    "percentGenomeCalled" => "percent_genome_called",
    "vadrPassFail" => "vadr_pass_fail",
    "coverageDepth" => "coverage_depth",
    "gcPercent" => "gc_percent",
    "refSnps" => "ref_snps",
    "percentIdentity" => "percent_identity",
    "nActg" => "n_actg",
    "nMissing" => "n_missing",
    "nAmbiguous" => "n_ambiguous",
    "referenceAccessionLength" => "reference_genome_length",
    # AMR result key mappings
    "totalReadsAMR" => TOTAL_READS_KEY,
    "passedQC" => QC_PERCENT_KEY,
    "nonHostReads" => REMAINING_READS_KEY,
    "duplicateCompressionRatio" => COMPRESSION_RATIO_KEY,
    "erccReads" => TOTAL_ERCC_READS_KEY,
    "subsampledFraction" => SUBSAMPLED_FRACTION_KEY,
    "meanInsertSize" => INSERT_SIZE_MEAN_KEY,
  }.freeze

  INPUT_SORT_KEYS = ["accession_id", "wetlab_protocol", "technology", "medaka_model"].freeze
  CACHED_RESULT_QUALITY_METRICS_KEY = "quality_metrics".freeze
  CACHED_RESULT_COVERAGE_VIZ_KEY = "coverage_viz".freeze
  CACHED_RESULT_SORT_KEYS = [
    "total_reads", "percent_genome_called", "vadr_pass_fail", "coverage_depth", "gc_percent",
    "ref_snps", "percent_identity", "n_actg", "n_missing", "n_ambiguous",
    "reference_genome_length", QC_PERCENT_KEY, REMAINING_READS_KEY, COMPRESSION_RATIO_KEY,
    TOTAL_ERCC_READS_KEY, SUBSAMPLED_FRACTION_KEY, INSERT_SIZE_MEAN_KEY,
  ].freeze
  TIEBREAKER_SORT_KEY = "id".freeze

  scope :sort_by_sample_name, lambda { |order_dir|
    order_statement = "samples.name #{order_dir}, samples.#{TIEBREAKER_SORT_KEY} #{order_dir}"
    left_outer_joins(:sample).order(Arel.sql(ActiveRecord::Base.sanitize_sql_array(order_statement)))
  }

  scope :sort_by_metadata, lambda { |sort_key, order_dir|
    # Note: if the workflow runs do not contain the specified metadata, all order_by's will be nil
    # and workflow runs will be sorted by TIEBREAKER_SORT_KEY
    joins_statement = "
        LEFT JOIN samples ON workflow_runs.sample_id = samples.id
        LEFT JOIN metadata ON (samples.id = metadata.sample_id AND metadata.key = '#{sort_key}')
    "
    order_by = sort_key == "ct_value" ? "number_validated_value" : "string_validated_value"

    joins(ActiveRecord::Base.send(:sanitize_sql_array, joins_statement)).order("metadata.#{order_by} #{order_dir}, workflow_runs.#{TIEBREAKER_SORT_KEY} #{order_dir}")
  }

  scope :sort_by_host_genome, lambda { |order_dir|
    joins_statement = "
        LEFT JOIN samples ON workflow_runs.sample_id = samples.id
        LEFT JOIN host_genomes ON host_genomes.id = samples.host_genome_id
    "
    joins(joins_statement).order("host_genomes.name #{order_dir}, workflow_runs.#{TIEBREAKER_SORT_KEY} #{order_dir}")
  }

  scope :sort_by_input, lambda { |sort_key, order_dir|
    order_statement = "JSON_EXTRACT(`inputs_json`, '$.#{sort_key}') #{order_dir}, #{TIEBREAKER_SORT_KEY} #{order_dir}"
    order(Arel.sql(ActiveRecord::Base.sanitize_sql_array(order_statement)))
  }

  scope :sort_by_cached_result, lambda { |sort_key, order_dir|
    cached_result_key = sort_key == "coverage_depth" ? CACHED_RESULT_COVERAGE_VIZ_KEY : CACHED_RESULT_QUALITY_METRICS_KEY
    order_statement = "JSON_EXTRACT(`cached_results`, '$.#{cached_result_key}.#{sort_key}') #{order_dir}, #{TIEBREAKER_SORT_KEY} #{order_dir}"
    order(Arel.sql(ActiveRecord::Base.sanitize_sql_array(order_statement)))
  }

  scope :sort_by_location, lambda { |order_dir|
    joins_statement = "
      LEFT JOIN samples ON (workflow_runs.sample_id = samples.id)
      LEFT JOIN metadata ON (samples.id = metadata.sample_id AND metadata.key = 'collection_location_v2')
      LEFT JOIN locations ON metadata.location_id = locations.id
    "
    # TODO(ihan): Investigate location metadata creation. I've implemented a workaround solution below,
    # but ideally, all location info should be stored by location_id.
    order_statement = "(CASE WHEN ISNULL(metadata.location_id) THEN metadata.string_validated_value ELSE locations.name END) #{order_dir}, samples.#{TIEBREAKER_SORT_KEY} #{order_dir}"
    joins(joins_statement).order(Arel.sql(ActiveRecord::Base.sanitize_sql_array(order_statement)))
  }

  scope :by_taxon, lambda { |taxon_id|
    query = "JSON_EXTRACT(`inputs_json`, '$.taxon_id') IN (#{taxon_id.join(',')})"
    where(Arel.sql(ActiveRecord::Base.sanitize_sql_array(query)))
  }

  validates :status, inclusion: { in: STATUS.values }

  scope :by_time, ->(start_date:, end_date:) { where(created_at: start_date.beginning_of_day..end_date.end_of_day) }
  scope :by_workflow, ->(workflow) { where(workflow: workflow) }

  scope :consensus_genomes, -> { where(workflow: WORKFLOW[:consensus_genome]) }
  scope :amr, -> { where(workflow: WORKFLOW[:amr]) }
  scope :non_deprecated, -> { where(deprecated: false) }
  scope :active, -> { where(status: WorkflowRun::STATUS[:succeeded], deprecated: false) }
  scope :viewable, ->(user) { where(sample: Sample.viewable(user)) }
  scope :created_by, ->(user) { includes(:sample).where(samples: { user: user }) }

  class RerunDeprecatedWorkflowError < StandardError
    def initialize
      super("Cannot rerun deprecated workflow runs.")
    end
  end

  def dispatch
    if workflow == WORKFLOW[:consensus_genome]
      SfnCgPipelineDispatchService.call(self)
    elsif workflow == WORKFLOW[:amr]
      SfnAmrPipelineDispatchService.call(self)
    end
  end

  def workflow_version_tag
    return "#{workflow}-v#{wdl_version}"
  end

  def update_status(remote_status = nil)
    remote_status ||= sfn_execution.description[:status]
    # Collapse failed status into our local unique failure status. Status retrieved from [2020/08/12]:
    # https://docs.aws.amazon.com/step-functions/latest/apireference/API_DescribeExecution.html#API_DescribeExecution_ResponseSyntax
    if remote_status_failed?(remote_status)
      remote_status = STATUS[:failed]

      error_message = nil
      if input_error.present?
        remote_status = STATUS[:succeeded_with_issue]
        error_message = input_error[:message]
      else
        Rails.logger.error("SampleFailedEvent: Sample #{sample.id} by " \
        "#{sample.user.role_name} failed WorkflowRun #{id} (#{workflow}). See: #{sample.status_url}")
        error_message = parse_yaml_error_message
      end
      update(
        time_to_finalized: time_since_executed_at,
        error_message: error_message,
        status: remote_status
      )
    elsif remote_status == STATUS[:succeeded]
      load_cached_results
      update(
        time_to_finalized: time_since_executed_at,
        status: remote_status
      )
    # prevent run status from reverting to RUNNING if messages are processed out of order
    elsif !finalized? && remote_status != status
      update(status: remote_status)
    end
  end

  def input_error
    sfn_error, sfn_error_message = sfn_execution.pipeline_error

    if INPUT_ERRORS.include?(sfn_error)
      return {
        label: sfn_error,
        message: sfn_error_message,
      }
    end
  end

  # TODO: can remove this method if we backfill the error_message column
  def error_message_display
    return error_message unless error_message.nil?
    return input_error[:message] unless input_error.nil?

    parse_yaml_error_message
  end

  def output_path(output_key)
    sfn_execution.output_path(output_key)
  end

  def output(output_key)
    path = output_path(output_key)
    return S3Util.get_s3_file(path)
  end

  def rerun
    raise RerunDeprecatedWorkflowError if deprecated?

    update!(deprecated: true)
    sample.create_and_dispatch_workflow_run(workflow, rerun_from: id, inputs_json: inputs_json)
  end

  # Generic misc inputs from inputs_json database field
  def inputs
    @inputs ||= JSON.parse(inputs_json || "null")
  end

  def get_input(input_name)
    inputs&.[](input_name)
  end

  def parsed_cached_results
    @parsed_cached_results ||= JSON.parse(cached_results || "null")
  end

  def finalized?
    [STATUS[:failed], STATUS[:succeeded], STATUS[:succeeded_with_issue]].include?(status)
  end

  def self.deletable(user)
    scope = where(status: [STATUS[:failed], STATUS[:succeeded], STATUS[:succeeded_with_issue]])
    unless user.admin?
      scope = scope.joins(:sample).where(sample: { user_id: user.id })
    end
    scope
  end

  def self.in_progress(workflow_name = nil)
    scope = where(status: STATUS[:running])
    scope = scope.where(workflow: workflow_name) if workflow_name.present?
    scope
  end

  def self.handle_sample_upload_failure(samples)
    # If the Sample Upload fails, assume that all runs in CREATED should be failed.
    WorkflowRun.where(sample: samples, status: WorkflowRun::STATUS[:created]).update_all(status: WorkflowRun::STATUS[:failed]) # rubocop:disable Rails/SkipsModelValidations
  end

  def self.handle_sample_upload_restart(sample)
    # Assumes that the latest failed run should be reset.
    WorkflowRun.where(sample: sample, status: WorkflowRun::STATUS[:failed]).order(created_at: :desc).first&.update(status: WorkflowRun::STATUS[:created])
  end

  # order_by stores a sortable column's dataKey (refer to: ColumnConfigurations.jsx)
  def self.sort_workflow_runs(workflow_runs, order_by, order_dir)
    sort_key = DATA_KEY_TO_SORT_KEY[order_by.to_s]
    metadata_sort_key = sanitize_metadata_field_name(order_by)

    if sort_key == "id"
      workflow_runs.order("workflow_runs.#{sort_key} #{order_dir}, workflow_runs.#{TIEBREAKER_SORT_KEY} #{order_dir}")
    elsif sort_key == "name"
      workflow_runs.sort_by_sample_name(order_dir)
    elsif sort_key == "host"
      workflow_runs.sort_by_host_genome(order_dir)
    elsif INPUT_SORT_KEYS.include?(sort_key)
      workflow_runs.sort_by_input(sort_key, order_dir)
    elsif CACHED_RESULT_SORT_KEYS.include?(sort_key)
      workflow_runs.sort_by_cached_result(sort_key, order_dir)
    elsif sort_key == "collection_location_v2"
      workflow_runs.sort_by_location(order_dir)
    elsif metadata_sort_key.present?
      workflow_runs.sort_by_metadata(metadata_sort_key, order_dir)
    else
      workflow_runs
    end
  end

  def workflow_by_class
    becomes(WORKFLOW_CLASS[workflow])
  end

  def sfn_results_path
    File.join(sfn_output_path, "#{workflow}-#{wdl_version.split('.')[0]}")
  end

  def sfn_output_path
    s3_output_prefix || sample.sample_output_s3_path
  end

  def workflow_version_at_least(version)
    return false unless wdl_version

    semantic_version = wdl_version.split("-").first
    major, minor, patch = semantic_version.split(".").map(&:to_i)
    test_major, test_minor, test_patch = version.split(".").map(&:to_i)

    # check major version, then minor version, then patch version
    if major > test_major
      return true
    elsif major == test_major
      if minor > test_minor
        return true
      elsif minor == test_minor
        return patch >= test_patch
      end
    end

    false
  end

  private

  def cleanup_s3
    return if sfn_output_path.blank?

    S3Util.delete_s3_prefix(sfn_output_path)
  end

  def sfn_execution
    @sfn_execution ||= SfnExecution.new(execution_arn: sfn_execution_arn, s3_path: sfn_output_path, finalized: finalized?)
  end

  # TODO: Consider refactoring with a different OOP approach or asynchronous results loading.
  # Use cached_results for simple outputs that need to be accessed quickly (e.g. in multi-WorkflowRun displays).
  # Don't use it for large or complex responses.
  def load_cached_results
    raise NotImplementedError unless workflow_by_class.respond_to?(:results)

    begin
      results = workflow_by_class.results(cacheable_only: true)
      update(cached_results: results.to_json)
    rescue ArgumentError
      raise NotImplementedError("Check that results support cacheable_only")
    rescue StandardError => exception
      LogUtil.log_error(
        "Error loading cached results",
        exception: exception,
        workflow_run_id: id
      )
      return nil
    end
  end

  def time_since_executed_at
    if executed_at
      Time.now.utc - executed_at # seconds
    end
  end

  def remote_status_failed?(remote_status)
    FAILED_REMOTE_STATUSES.include?(remote_status)
  end

  def parse_yaml_error_message
    _, error_message = sfn_execution.pipeline_error
    begin
      # uncaught errors require another level of parsing in YAML this time
      YAML.safe_load(error_message, symbolize_names: true)[:message]
    rescue StandardError => e
      Rails.logger.error("YAML safe_load failed parsing sfn error message, #{e.message}\n " \
      "error_message object #{error_message}")
      return nil
    end
  end
end
