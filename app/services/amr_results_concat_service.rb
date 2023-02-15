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
    workflow_runs = AmrWorkflowRun.where(id: @workflow_run_ids)
    missing_ids = @workflow_run_ids - workflow_runs.pluck(:id)
    raise WorkflowRunNotFoundError, missing_ids if missing_ids.present?

    CSVSafe.generate(headers: true) do |csv|
      headers = nil

      workflow_runs.each do |wr|
        content = get_output_file_contents(wr)

        headers_extra = ["total_reads", "rpm", "dpm"]
        unless content.empty?
          if headers.nil?
            headers = CSVSafe.parse(get_output_file_contents(workflow_runs.first), col_sep: "\t").first
            unless headers.nil?
              csv << headers + headers_extra
            end
          end

          # Add more data columns in the CSV
          column_reads = headers.index { |c| c == "num_reads" }
          column_depth = headers.index { |c| c == "read_coverage_depth" }

          # Parse CSV, skip header and add extra columns
          parsed_csv = CSVSafe.parse(content, col_sep: "\t")
          parsed_csv.shift
          parsed_csv.each do |row|
            row_extra = [
              wr.amr_metrics&.[]("total_reads"),
              wr.rpm(row[column_reads].to_f),
              wr.rpm(row[column_depth].to_f),
            ]
            csv << row + row_extra
          end
        end
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
