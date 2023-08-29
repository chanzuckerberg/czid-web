class BenchmarkWorkflowRun < WorkflowRun
  AWS_S3_TRUTH_FILES_BUCKET = "s3://idseq-bench/datasets/truth_files/".freeze

  OUTPUT_BENCHMARK_HTML_TEMPLATE = "benchmark.%<workflow_name>s_benchmark.benchmark_html".freeze
  OUTPUT_BENCHMARK_NOTEBOOK_TEMPLATE = "benchmark.%<workflow_name>s_benchmark.benchmark_notebook".freeze

  def results(cacheable_only: false)
    results = {
      "benchmark_metrics" => parsed_cached_results&.[]("benchmark_metrics") || benchmark_metrics,
      # Store additional info about the runs used in the benchmark.
      # In the case that a run gets deleted, we can still refer to this info for benchmark results.
      "additional_info" => parsed_cached_results&.[]("additional_info") || additional_info,
    }

    unless cacheable_only
      results["benchmark_html_report"] = benchmark_html_report
      results["benchmark_info"] = benchmark_info
    end

    results
  end

  def get_output_name(output_template)
    format(output_template, workflow_name: inputs&.[]("workflow_benchmarked")&.underscore)
  end

  private

  def benchmark_metrics
    BenchmarkMetricsService.call(self)
  rescue StandardError => exception
    LogUtil.log_error(
      "Error loading benchmark metrics",
      exception: exception,
      workflow_run_id: id
    )
    return nil
  end

  def benchmark_html_report
    output_name = get_output_name(OUTPUT_BENCHMARK_HTML_TEMPLATE)
    output(output_name)
  end

  def benchmark_info
    return {
      sample_ids: inputs&.[]("sample_ids"),
      workflow: inputs&.[]("workflow_benchmarked"),
      ground_truth_file: inputs&.[]("ground_truth_file"),
    }
  end

  def additional_info
    if WorkflowRun::MNGS_WORKFLOWS.include?(inputs&.[]("workflow_benchmarked"))
      additional_mngs_info
    else
      {}
    end
  end

  def additional_mngs_info
    run_ids = inputs&.[]("run_ids")
    info = run_ids.each_with_object({}) do |run_id, result|
      pr = PipelineRun.find(run_id)
      sample_id = pr&.sample&.id

      result[sample_id] = {
        run_id: run_id,
        pipeline_version: pr&.pipeline_version,
        ncbi_index_version: pr&.alignment_config&.name,
      }
    end
    info
  end
end
