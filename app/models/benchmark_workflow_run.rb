class BenchmarkWorkflowRun < WorkflowRun
  def results(cacheable_only: false)
    results = {
      "benchmark_metrics" => parsed_cached_results&.[]("benchmark_metrics") || benchmark_metrics,
      # Store additional info about the runs used in the benchmark.
      # In the case that a run gets deleted, we can still refer to this info for benchmark results.
      "additional_info" => parsed_cached_results&.[]("additional_info") || additional_info,
    }

    unless cacheable_only
      results["benchmark_info"] = parsed_cached_results&.[]("benchmark_info") || benchmark_info
    end

    results
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

  def benchmark_info
    return {
      run_ids: inputs&.[]("run_ids"), # Can either be WorkflowRun ids or a PipelineRun ids
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
      result[run_id] = {
        pipeline_version: pr&.pipeline_version,
        ncbi_index_version: pr&.alignment_config&.name,
      }
    end
    info
  end
end
