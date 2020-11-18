class ConsensusGenomeConcatService
  include Callable

  class WorkflowRunNotFoundError < StandardError
    def initialize(missing_ids)
      super("WorkflowRun(s) not found: #{missing_ids}")
    end
  end

  class EmptyS3FileError < StandardError
    def initialize(s3_path)
      super("Failed to read data at: #{s3_path}")
    end
  end

  def initialize(workflow_run_ids)
    @workflow_run_ids = workflow_run_ids
  end

  def call
    return generate_concatenated_fasta
  end

  private

  def generate_concatenated_fasta
    workflow_runs = WorkflowRun.where(id: @workflow_run_ids)
    missing_ids = @workflow_run_ids - workflow_runs.pluck(:id)
    raise WorkflowRunNotFoundError, missing_ids if missing_ids.present?

    fasta_body = ""
    workflow_runs.each do |wr|
      s3_path = wr.output_path(ConsensusGenomeWorkflowRun::OUTPUT_CONSENSUS)
      content = S3Util.get_s3_file(s3_path)
      raise EmptyS3FileError, s3_path unless content

      fasta_body += content
    end
    return fasta_body
  end
end
