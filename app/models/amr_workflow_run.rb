class AmrWorkflowRun < WorkflowRun
  # Model Notes:
  #
  # Where is the schema for this model?
  # * This inherits from WorkflowRun, following a Single Table Inheritance
  #   pattern. The hope is one generic WorkflowRun schema can cover many
  #   different workflow use-cases.
  #
  # Why do we have one main 'results' method?
  # * The idea is that the model should have one set of well-defined outputs
  #   that are consistently served, instead of having client pages compose
  #   different sets of results each time.
  #
  # * You can find all outputs of a particluar AMR workflow run in the AWS console
  #   by visiting the "Execution Input and Outputs" section of the SFN execution.
  MODERN_HOST_FILTERING_VERSION = "0.3.1".freeze
  OUTPUT_ZIP = "amr.ZipOutputs.output_zip".freeze
  OUTPUT_REPORT = "amr.RunResultsPerSample.synthesized_report".freeze
  OUTPUT_CONTIGS = "amr.RunSpades.contigs".freeze
  OUTPUT_READS_BAM = "amr.RunRgiBwtKma.output_sorted_length_100".freeze
  OUTPUT_READS_BAI = "amr.RunRgiBwtKma.output_sorted_length_100_bai".freeze
  OUTPUT_CONTIGS_BAM = "amr.tsvToSam.output_sorted".freeze
  OUTPUT_CONTIGS_BAI = "amr.tsvToSam.output_sorted_bai".freeze
  OUTPUT_COMPREHENSIVE_AMR_METRICS_TSV = "amr.RunResultsPerSample.final_summary".freeze

  # cacheable_only results will be stored in the db.
  # Full results will fetch from S3 (a superset of cached results).
  def results(cacheable_only: false)
    results = {}
    results["quality_metrics"] = amr_metrics
    unless cacheable_only
      results["report_table_data"] = amr_report
    end

    results
  end

  def amr_metrics
    AmrMetricsService.call(self)
  rescue StandardError => exception
    LogUtil.log_error(
      "Error loading counts metrics",
      exception: exception,
      workflow_run_id: id
    )
    return nil
  end

  def amr_report
    AmrReportDataService.call(self)
  rescue StandardError => exception
    LogUtil.log_error(
      "Error loading report",
      exception: exception,
      workflow_run_id: id
    )
    return nil
  end

  def dpm(read_coverage_depth)
    count_per_million(read_coverage_depth)
  end

  def rpm(read_count)
    count_per_million(read_count)
  end

  def count_per_million(raw_count)
    amr_metrics = parsed_cached_results&.dig("quality_metrics")
    return nil if amr_metrics.nil?

    total_reads = amr_metrics["total_reads"]
    total_ercc_reads = amr_metrics["total_ercc_reads"] || 0
    fraction_subsampled = amr_metrics["fraction_subsampled"]

    count = raw_count / ((total_reads - total_ercc_reads) * fraction_subsampled) * 1_000_000.0
    count.round(2)
  end

  def zip_link
    WorkflowRunZipService.call(self)
  rescue StandardError => exception
    LogUtil.log_error(
      "Error loading zip link",
      exception: exception,
      workflow_run_id: id
    )
    return nil
  end

  # Download the reads that map to a gene
  def download_gene_level_reads(gene_id)
    AmrGeneLevelDownloadsService.call(self, AmrGeneLevelDownloadsService::DOWNLOAD_TYPE_READS, gene_id)
  end

  # Download the contigs that map to a gene
  def download_gene_level_contigs(gene_id)
    AmrGeneLevelDownloadsService.call(self, AmrGeneLevelDownloadsService::DOWNLOAD_TYPE_CONTIGS, gene_id)
  end

  def uses_modern_host_filtering?
    workflow_version_at_least(MODERN_HOST_FILTERING_VERSION)
  end
end
