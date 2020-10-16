class ConsensusGenomeZipService
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
    s3_path = @workflow_run.output_path(ConsensusGenomeWorkflowRun::OUTPUT_ZIP)
    sample_name = @workflow_run.sample.name
    return get_presigned_s3_url(s3_path, "#{sample_name}_outputs.zip")
  end
end
