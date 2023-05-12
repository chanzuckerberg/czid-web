class AmrMetricsService
  include Callable

  COUNT_INPUT_READ = "input_read_count".freeze
  COUNT_GSNAP_FILTER_OUT = "gsnap_filter_out_count".freeze
  COUNT_BOWTIE2_OUT = "bowtie2_out_count".freeze
  COUNT_SUBSAMPLED_OUT = "subsampled_out_count".freeze
  COUNT_CZID_DEDUP_OUT = "czid_dedup_out_count".freeze
  COUNT_PRICESEQ_OUT = "priceseq_out_count".freeze
  COUNT_STAR_OUT = "star_out_count".freeze

  COUNT_BOWTIE2_ERCC_FILTERED_OUT = "bowtie2_ercc_filtered_out_count".freeze
  COUNT_FASTP_OUT = "fastp_out_count".freeze
  COUNT_BOWTIE2_HOST_FILTERED_OUT = "bowtie2_host_filtered_out_count".freeze
  COUNT_HISAT2_HOST_FILTERED_OUT = "hisat2_host_filtered_out_count".freeze
  COUNT_BOWTIE2_HUMAN_FILTERED_OUT = "bowtie2_human_filtered_out_count".freeze
  COUNT_HISAT2_HUMAN_FILTERED_OUT = "hisat2_human_filtered_out_count".freeze
  COUNT_VALIDATE_INPUT = "validate_input_out_count".freeze

  COUNTS = [
    COUNT_INPUT_READ,
    COUNT_GSNAP_FILTER_OUT,
    COUNT_BOWTIE2_OUT,
    COUNT_SUBSAMPLED_OUT,
    COUNT_CZID_DEDUP_OUT,
    COUNT_PRICESEQ_OUT,
    COUNT_STAR_OUT,
  ].freeze

  MODERN_COUNTS = [
    COUNT_INPUT_READ,
    COUNT_BOWTIE2_ERCC_FILTERED_OUT,
    COUNT_FASTP_OUT,
    COUNT_CZID_DEDUP_OUT,
    COUNT_SUBSAMPLED_OUT,
    COUNT_VALIDATE_INPUT,
  ].freeze

  # If the host is human, only the host is filtered out
  HUMAN_HOST_FILTER_COUNTS = [
    COUNT_BOWTIE2_HOST_FILTERED_OUT,
    COUNT_HISAT2_HOST_FILTERED_OUT,
  ].freeze

  # If the host is non-human, the host and any human reads are filtered out
  NON_HUMAN_HOST_FILTER_COUNTS = HUMAN_HOST_FILTER_COUNTS + [
    COUNT_BOWTIE2_HUMAN_FILTERED_OUT,
    COUNT_HISAT2_HUMAN_FILTERED_OUT,
  ].freeze

  MODERN_ERCC_FILE = "bowtie2_ERCC_counts_tsv".freeze
  HOST_FILTER_STAGE_NAME = "host_filter_stage".freeze
  ERCC_FILE = "output_gene_file".freeze
  MODERN_INSERT_SIZE_METRICS = "insert_size_metrics".freeze
  INSERT_SIZE_METRICS = "output_metrics_file".freeze
  HISAT2_HUMAN_FILTERED_OUT_STEP_NAME = "hisat2_human_filtered_out".freeze
  HISAT2_HOST_FILTERED_OUT_STEP_NAME = "hisat2_host_filtered_out".freeze

  PIPELINE_RUN_METRIC_KEYS = [
    WorkflowRun::TOTAL_READS_KEY,
    WorkflowRun::QC_PERCENT_KEY,
    WorkflowRun::REMAINING_READS_KEY,
    WorkflowRun::COMPRESSION_RATIO_KEY,
    WorkflowRun::TOTAL_ERCC_READS_KEY,
    WorkflowRun::SUBSAMPLED_FRACTION_KEY,
  ].freeze

  def initialize(workflow_run)
    @workflow_run = workflow_run
    @uses_modern_host_filtering = workflow_run.workflow_by_class.uses_modern_host_filtering?
    @last_filtering_step_name = workflow_run.sample.host_genome.name != "Human" ? HISAT2_HUMAN_FILTERED_OUT_STEP_NAME : HISAT2_HOST_FILTERED_OUT_STEP_NAME
  end

  def call
    if workflow_run_started_from_mngs?
      return metrics_from_pipeline_run
    else
      counts = retrieve_counts
      return @uses_modern_host_filtering ? calculate_modern_metrics(counts) : calculate_metrics(counts)
    end
  end

  private

  def calculate_modern_metrics(counts)
    {}.tap do |metrics|
      total_reads = retrieve_total_reads(counts)
      metrics[WorkflowRun::TOTAL_READS_KEY] = total_reads
      metrics[WorkflowRun::QC_PERCENT_KEY] = retrieve_modern_passed_qc(counts)
      remaining_reads = retrieve_modern_passed_filters(counts)
      metrics[WorkflowRun::REMAINING_READS_KEY] = remaining_reads
      metrics[WorkflowRun::COMPRESSION_RATIO_KEY] = retrieve_modern_dcr(counts)
      metrics[WorkflowRun::TOTAL_ERCC_READS_KEY] = retrieve_ercc_counts
      metrics[WorkflowRun::SUBSAMPLED_FRACTION_KEY] = retrieve_modern_subsampled_fraction(counts)

      insert_size_mean, insert_size_standard_deviation = retrieve_insert_size_metrics(MODERN_INSERT_SIZE_METRICS)
      metrics[WorkflowRun::INSERT_SIZE_MEAN_KEY] = insert_size_mean
      metrics[WorkflowRun::INSERT_SIZE_STD_DEV_KEY] = insert_size_standard_deviation
      metrics[WorkflowRun::PERCENT_REMAINING_KEY] = compute_percentage_reads(
        remaining_reads,
        total_reads
      )
    end
  end

  def calculate_metrics(counts)
    metrics = {}

    total_reads = retrieve_total_reads(counts)
    metrics[WorkflowRun::TOTAL_READS_KEY] = total_reads
    metrics[WorkflowRun::QC_PERCENT_KEY] = retrieve_passed_qc(counts)
    remaining_reads = retrieve_passed_filters(counts)
    metrics[WorkflowRun::REMAINING_READS_KEY] = remaining_reads
    metrics[WorkflowRun::COMPRESSION_RATIO_KEY] = retrieve_dcr(counts)
    metrics[WorkflowRun::TOTAL_ERCC_READS_KEY] = retrieve_ercc_counts
    metrics[WorkflowRun::SUBSAMPLED_FRACTION_KEY] = retrieve_subsampled_fraction(counts)

    insert_size_mean, insert_size_standard_deviation = retrieve_insert_size_metrics(INSERT_SIZE_METRICS)
    metrics[WorkflowRun::INSERT_SIZE_MEAN_KEY] = insert_size_mean
    metrics[WorkflowRun::INSERT_SIZE_STD_DEV_KEY] = insert_size_standard_deviation
    metrics[WorkflowRun::PERCENT_REMAINING_KEY] = compute_percentage_reads(
      remaining_reads,
      total_reads
    )

    metrics
  end

  def workflow_run_started_from_mngs?
    @workflow_run.get_input("start_from_mngs") == "true"
  end

  def metrics_from_pipeline_run
    pipeline_run = @workflow_run.sample.pipeline_runs.non_deprecated.first
    metrics = {}

    PIPELINE_RUN_METRIC_KEYS.each do |key|
      metrics[key] = pipeline_run[key]
    end

    pipeline_run_insert_size_metrics = InsertSizeMetricSet.find_by(pipeline_run_id: pipeline_run.id)
    metrics[WorkflowRun::INSERT_SIZE_MEAN_KEY] = pipeline_run_insert_size_metrics&.mean
    metrics[WorkflowRun::INSERT_SIZE_STD_DEV_KEY] = pipeline_run_insert_size_metrics&.standard_deviation

    metrics[WorkflowRun::PERCENT_REMAINING_KEY] = compute_percentage_reads_for_pipeline_run(pipeline_run)

    metrics
  end

  def retrieve_counts
    counts_to_retrieve = if @uses_modern_host_filtering
                           MODERN_COUNTS + (@last_filtering_step_name == HISAT2_HUMAN_FILTERED_OUT_STEP_NAME ? NON_HUMAN_HOST_FILTER_COUNTS : HUMAN_HOST_FILTER_COUNTS)
                         else
                           COUNTS
                         end
    counts_to_retrieve.each_with_object({}) do |count, hash|
      step_name = count.chomp("_count")
      step_key = step_name == "input_read" ? "fastqs" : step_name
      hash[step_name] = JSON.parse(@workflow_run.output("#{@workflow_run.workflow}.#{HOST_FILTER_STAGE_NAME}.#{count}"))[step_key]&.to_i
    rescue SfnExecution::OutputNotFoundError
      # if the host is Human, should not have bowtie2_human_out_count or star_human_out_count files
      Rails.logger.warn("Could not find file: #{count}")
    end
  end

  def retrieve_total_reads(counts)
    counts["input_read"]
  end

  def retrieve_modern_passed_qc(counts)
    return unless counts["fastp_out"] && counts["bowtie2_ercc_filtered_out"]

    (100.0 * counts["fastp_out"]) / counts["bowtie2_ercc_filtered_out"]
  end

  def retrieve_passed_qc(counts)
    return unless counts["priceseq_out"] && counts["star_out"]

    (100.0 * counts["priceseq_out"]) / counts["star_out"] # this is done originally as an "update", not sure what the original value was
  end

  def retrieve_modern_subsampled_fraction(counts)
    counts_after_last_filtering_step = counts[@last_filtering_step_name]
    return unless counts_after_last_filtering_step && counts["subsampled_out"]

    counts_after_last_filtering_step > 0 ? ((1.0 * counts["subsampled_out"]) / counts_after_last_filtering_step) : 1.0
  end

  def retrieve_subsampled_fraction(counts)
    return unless counts["bowtie2_out"] && counts["subsampled_out"]

    counts["bowtie2_out"] > 0 ? ((1.0 * counts["subsampled_out"]) / counts["bowtie2_out"]) : 1.0
  end

  def retrieve_modern_passed_filters(counts)
    # "Passed filters" is the same thing as "adjusted remaining reads"
    counts["subsampled_out"]
  end

  def retrieve_passed_filters(counts)
    subsampled_fraction = retrieve_subsampled_fraction(counts)
    return unless subsampled_fraction && counts["gsnap_filter_out"]

    (counts["gsnap_filter_out"] * (1 / subsampled_fraction)).to_i
  end

  def compute_percentage_reads_for_pipeline_run(pipeline_run)
    compute_percentage_reads(
      pipeline_run[WorkflowRun::REMAINING_READS_KEY],
      pipeline_run[WorkflowRun::TOTAL_READS_KEY]
    )
  end

  def compute_percentage_reads(adjusted_remaining_reads, total_reads)
    return nil if adjusted_remaining_reads.nil? || total_reads.nil?

    (100.0 * adjusted_remaining_reads) / total_reads
  end

  def retrieve_modern_dcr(counts)
    # "DCR" is the same thing as "compression ratio"
    counts_after_last_filtering_step = counts[@last_filtering_step_name]
    return unless counts["czid_dedup_out"] && counts_after_last_filtering_step

    (1.0 * counts_after_last_filtering_step) / counts["czid_dedup_out"]
  end

  def retrieve_dcr(counts)
    return unless counts["priceseq_out"] && counts["czid_dedup_out"]

    (1.0 * counts["priceseq_out"]) / counts["czid_dedup_out"]
  end

  def retrieve_ercc_counts
    ercc_file = @uses_modern_host_filtering ? MODERN_ERCC_FILE : ERCC_FILE

    ercc = @workflow_run.output("#{@workflow_run.workflow}.#{HOST_FILTER_STAGE_NAME}.#{ercc_file}").split("\n").select { |str| str.starts_with?("ERCC") }
    ercc.each_with_object({}) do |ercc_line, hash|
      cols = ercc_line.split("\t")
      hash[cols[0]] = cols[1].to_i
    end.values.sum
  rescue StandardError
    Rails.logger.warn("Could not load ERCC counts")
    return nil
  end

  def retrieve_insert_size_metrics(output_name)
    # TODO: Consider extracting to a service object, since this is
    # mostly copied from db_load_insert_size_metrics in pipeline_run.rb

    mean_insert_txt = @workflow_run.output("#{@workflow_run.workflow}.#{HOST_FILTER_STAGE_NAME}.#{output_name}")
    tsv_lines = []
    tsv_header_line = -1
    mean_insert_txt.lines.each_with_index do |line, index|
      if line.start_with?("## METRICS CLASS")
        tsv_header_line = index
      elsif tsv_header_line > 0 && index - tsv_header_line <= 2
        tsv_lines << CSV.parse_line(line, col_sep: "\t")
      elsif tsv_lines.length >= 2
        break
      end
    end
    if tsv_lines.length != 2
      error_message = "Workflow run ##{@workflow_run.id} has an insert size metrics file but metrics could not be found"
      LogUtil.log_error(
        error_message,
        pipeline_run_id: id
      )
      raise error_message
    end
    insert_size_metrics = {}
    tsv_lines[0].zip(tsv_lines[1]).each do |row|
      insert_size_metrics[row[0]] = row[1]
    end

    insert_size_mean = insert_size_metrics[PipelineRun::MEAN_INSERT_SIZE_NAME].to_i
    insert_size_standard_deviation = insert_size_metrics[PipelineRun::STANDARD_DEVIATION_NAME].to_f
    [insert_size_mean, insert_size_standard_deviation]
  rescue StandardError
    Rails.logger.warn("Could not load Mean Insert Size")
    return nil
  end
end
