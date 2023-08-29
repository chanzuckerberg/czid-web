class BenchmarkMetricsService
  include Callable

  def initialize(workflow_run)
    @benchmark_workflow_run = workflow_run.workflow_by_class
    @workflow_benchmarked = @benchmark_workflow_run.get_input("workflow_benchmarked")
  end

  def call
    return generate
  end

  private

  def generate
    metrics = add_primary_metrics

    return metrics
  rescue SfnExecution::SfnDescriptionNotFoundError => err
    LogUtil.log_error("BenchmarkMetricsService: Cannot generate Benchmark metrics when the SFN description is not found", exception: err)
    return nil
  end

  def add_primary_metrics
    if @workflow_benchmarked == WorkflowRun::WORKFLOW[:short_read_mngs]
      primary_short_read_mgns_metrics
    else
      {}
    end
  end

  def primary_short_read_mgns_metrics
    # AUPR and L2 Norm are only available if a ground truth file is provided
    if @benchmark_workflow_run.get_input("ground_truth_file").present?
      nt_file_path = @benchmark_workflow_run.get_output_name(BenchmarkWorkflowRun::OUTPUT_BENCHMARK_TRUTH_NT_TEMPLATE)
      nr_file_path = @benchmark_workflow_run.get_output_name(BenchmarkWorkflowRun::OUTPUT_BENCHMARK_TRUTH_NR_TEMPLATE)

      nt_file = JSON.parse(@benchmark_workflow_run.output(nt_file_path))
      nr_file = JSON.parse(@benchmark_workflow_run.output(nr_file_path))
    end

    metrics = {}.tap do |h|
      if nt_file.present? && nr_file.present?
        h[:nt_aupr] = nt_file["aupr"]["aupr"]
        h[:nt_l2_norm] = nt_file["l2_norm"]

        h[:nr_aupr] = nr_file["aupr"]["aupr"]
        h[:nr_l2_norm] = nr_file["l2_norm"]
      end
    end

    metrics
  end
end
