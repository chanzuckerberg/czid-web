class AmrResultsConcatService
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
    return generate_concatenated_results_file
  end

  private

  def generate_concatenated_results_file
    workflow_runs = WorkflowRun.where(id: @workflow_run_ids)
    missing_ids = @workflow_run_ids - workflow_runs.pluck(:id)
    raise WorkflowRunNotFoundError, missing_ids if missing_ids.present?

    CSVSafe.generate(headers: true) do |csv|
      headers = CSVSafe.parse(get_output_file_contents(workflow_runs.first), col_sep: "\t").first
      csv << headers

      workflow_runs.each do |wr|
        content = get_output_file_contents(wr)
        parsed_csv = CSV.parse(content, col_sep: "\t")
        # skip the headers, we only care about the contents of the CSV because the headers were already added above
        parsed_csv.shift
        parsed_csv.each { |row| csv << row }
      end
    end
  end

  def get_output_file_contents(wr)
    s3_path = wr.output_path(AmrWorkflowRun::OUTPUT_REPORT)
    content = S3Util.get_s3_file(s3_path)
    raise EmptyS3FileError, s3_path unless content

    return content
  end
end
