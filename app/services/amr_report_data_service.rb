class AmrReportDataService
  include Callable

  # The order is important here as it determines the order of the columns in the CSV
  CSV_COLUMNS = [
    "gene",
    "gene_family",
    "drug_class",
    "high_level_drug_class",
    "mechanism",
    "model",
    "cutoff",
    "contigs",
    "contig_coverage_breadth",
    "contig_percent_id",
    "contig_species",
    "reads",
    "rpm",
    "read_coverage_breadth",
    "read_coverage_depth",
    "dpm",
    "read_species",
  ].freeze

  def initialize(workflow_run, csv: false)
    @workflow_run = workflow_run
    @csv = csv
  end

  def call
    report_data = amr_report_data

    if @csv
      return generate_report_csv(report_data)
    else
      return report_data
    end
  end

  private

  def amr_report_data
    amr_report_tsv = @workflow_run.output(AmrWorkflowRun::OUTPUT_REPORT)

    report_data = []
    CSVSafe.parse(amr_report_tsv, col_sep: "\t", headers: true) do |row|
      report_row = {
        "drug_class" => row["drug_class"],
        "gene" => row["gene_name"],
        "gene_id" => row["read_gene_id"],
        "gene_family" => row["gene_family"],
        "high_level_drug_class" => row["high_level_drug_class"],
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
        "read_species" => row["read_species"],
        "contig_species" => row["contig_species"],
      }

      report_data << report_row
    end

    report_data
  end

  def generate_report_csv(report_data)
    CSVSafe.generate(headers: true) do |csv|
      csv << CSV_COLUMNS
      report_data.each { |row| csv << row.values_at(*CSV_COLUMNS) }
    end
  end
end
