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

  def initialize(workflow_run_ids, headers: nil)
    @workflow_run_ids = workflow_run_ids
    @headers = headers
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

      if @headers
        # If new headers are provided (ex: with the accession id added), replace the existing fasta header
        header = @headers[wr.id]
        fasta_body += (header + content.partition("\n").last)
      else
        fasta_body += content
      end
    end
    return fasta_body
  end
end
