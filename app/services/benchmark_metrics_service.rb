class BenchmarkMetricsService
  include Callable

  def initialize(workflow_run)
    @benchmark_workflow_run = workflow_run.workflow_by_class
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
    if @benchmark_workflow_run.inputs&.[]("workflow_benchmarked") == WorkflowRun::WORKFLOW[:short_read_mngs]
      primary_short_read_mgns_metrics
    else
      {}
    end
  end

  def primary_short_read_mgns_metrics
    # TODO: Add AUPR and Correlation values. May need to tweak WDL outputs to make this easily accessible.
    {
      aupr: nil,
      correlation: nil,
    }
  end
end
