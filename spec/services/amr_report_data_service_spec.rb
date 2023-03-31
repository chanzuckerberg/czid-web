require "rails_helper"

RSpec.describe AmrReportDataService, type: :service do
  let(:project) { create(:project) }
  let(:sample) { create(:sample, project: project) }
  let(:workflow_run) do
    create(
      :workflow_run,
      sample: sample,
      workflow: WorkflowRun::WORKFLOW[:amr],
      cached_results: "{"\
      "\"quality_metrics\": {"\
        "\"total_reads\": 24589996,"\
        "\"total_ercc_reads\": 29,"\
        "\"fraction_subsampled\": 0.08770846807107392"\
      "}"\
    "}"
    ).becomes(AmrWorkflowRun)
  end

  let(:output_csv) do
    "gene_name\tsample_name\tgene_family\tdrug_class\tresistance_mechanism\t"\
    "model_type\tnum_contigs\tcutoff\tcontig_coverage_breadth\tcontig_percent_id\t"\
    "contig_species\tnum_reads\tread_coverage_breadth\tread_coverage_depth\tread_species"\
    "\n"\
    "abca\tnorg_6__nacc_27__uniform_weight_per_organism__hiseq_reads__v6__11\t"\
    "ATP-binding cassette (ABC) antibiotic efflux pump\tcephalosporin; penam; "\
    "peptide antibiotic\tantibiotic efflux\tprotein homolog\t0\t\t\t\t\t1\t2.89\t0.03\t"
  end

  describe "#call" do
    before do
      allow_any_instance_of(AmrWorkflowRun)
        .to receive(:output)
        .with(AmrWorkflowRun::OUTPUT_REPORT)
        .and_return(output_csv)
    end

    it "returns the expected data" do
      report_data_row = described_class.call(workflow_run).first
      expect(report_data_row["drug_class"]).to eq("cephalosporin; penam; peptide antibiotic")
      expect(report_data_row["gene"]).to eq("abca")
      expect(report_data_row["mechanism"]).to eq("antibiotic efflux")
      expect(report_data_row["model"]).to eq("protein homolog")
      expect(report_data_row["contigs"]).to eq("0")
      expect(report_data_row["cutoff"]).to eq(nil)
      expect(report_data_row["contig_coverage_breadth"]).to eq(nil)
      expect(report_data_row["contig_percent_id"]).to eq(nil)
      expect(report_data_row["reads"]).to eq("1")
      expect(report_data_row["rpm"]).to eq(0.46)
      expect(report_data_row["read_coverage_breadth"]).to eq("2.89")
      expect(report_data_row["read_coverage_depth"]).to eq("0.03")
      expect(report_data_row["dpm"]).to eq(0.01)
    end
  end
end
