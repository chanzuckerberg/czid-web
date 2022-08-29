class WorkflowRunZipService
  include Callable
  include PipelineOutputsHelper

  def initialize(workflow_run)
    @workflow_run = workflow_run
  end

  def call
    return generate
  end

  private

  def generate
    s3_path = @workflow_run.output_path(@workflow_run.workflow_by_class.class::OUTPUT_ZIP)
    sample_name = @workflow_run.sample.name
    return get_presigned_s3_url(s3_path: s3_path, filename: "#{sample_name}_#{@workflow_run.id}_outputs.zip")
  end
end
