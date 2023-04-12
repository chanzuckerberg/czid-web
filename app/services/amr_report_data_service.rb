class AmrReportDataService
  include Callable

  def initialize(workflow_run)
    @workflow_run = workflow_run
  end

  def call
    return amr_report_data
  end

  private

  def amr_report_data
    amr_report_tsv = @workflow_run.output(AmrWorkflowRun::OUTPUT_REPORT)

    report_data = []
    CSVSafe.parse(amr_report_tsv, col_sep: "\t", headers: true) do |row|
      report_row = {
        "drug_class" => row["drug_class"],
        "gene" => row["gene_name"],
        "gene_family" => row["gene_family"],
        "mechanism" => row["resistance_mechanism"],
        "model" => row["model_type"],
        "contigs" => row["num_contigs"],
        "cutoff" => row["cutoff"],
        "contig_coverage_breadth" => row["contig_coverage_breadth"],
        "contig_percent_id" => row["contig_percent_id"],
        "reads" => row["num_reads"],
        "rpm" => @workflow_run.rpm(row["num_reads"].to_f),
        "read_coverage_breadth" => row["read_coverage_breadth"],
        "read_coverage_depth" => row["read_coverage_depth"],
        "dpm" => @workflow_run.dpm(row["read_coverage_depth"].to_f),
      }

      report_data << report_row
    end

    report_data
  end
end
