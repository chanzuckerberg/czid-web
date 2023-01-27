require 'rails_helper'

RSpec.describe TopTaxonsSqlService, type: :service do
  let(:mock_background_id) { 123 }

  before do
    create(:taxon_lineage, tax_name: "Klebsiella pneumoniae", taxid: 573, genus_taxid: 570, superkingdom_taxid: 2)
    create(:taxon_lineage, tax_name: "Klebsiella", taxid: 570, genus_taxid: 570, superkingdom_taxid: 2)
  end

  context "when workflow is amr or consensus genome" do
    it "should raise an exception" do
      [WorkflowRun::WORKFLOW[:amr], WorkflowRun::WORKFLOW[:consensus_genome]].each do |workflow|
        sample = create(:sample, project: create(:project), initial_workflow: workflow)
        samples = Sample.where(id: [sample.id])
        expect do
          TopTaxonsSqlService.call(samples, mock_background_id, min_reads: 0)
        end.to raise_error("TopTaxonsSqlService error processing samples for workflow: #{workflow}")
      end
    end
  end

  context "when samples contain more than 1 workflow" do
    it "should raise an exception" do
      sample1 = create(:sample, project: create(:project), initial_workflow: WorkflowRun::WORKFLOW[:short_read_mngs])
      sample2 = create(:sample, project: create(:project), initial_workflow: WorkflowRun::WORKFLOW[:long_read_mngs])
      samples = Sample.where(id: [sample1.id, sample2.id])
      expect do
        TopTaxonsSqlService.call(samples, mock_background_id, min_reads: 0)
      end.to raise_error("TopTaxonsSqlService error processing samples with differing workflows: #{samples.pluck(:initial_workflow).uniq}")
    end
  end

  context "when workflow is short-read-mngs" do
    let(:workflow) { WorkflowRun::WORKFLOW[:short_read_mngs] }

    before do
      @sample1 = create(:sample, project: create(:project), initial_workflow: workflow)
      @pipeline_run1 = create(:pipeline_run,
                              sample: @sample1,
                              total_reads: 1122,
                              adjusted_remaining_reads: 316,
                              subsample: 1_000_000,
                              taxon_counts_data: [{
                                tax_level: 1,
                                taxon_name: "Klebsiella pneumoniae",
                                nt: 209,
                                percent_identity: 99.6995,
                                alignment_length: 149.402,
                                e_value: -89.5641,
                              }, {
                                tax_level: 1,
                                taxon_name: "Klebsiella pneumoniae",
                                nr: 69,
                                percent_identity: 97.8565,
                                alignment_length: 46.3623,
                                e_value: -16.9101,
                              }, {
                                tax_level: 2,
                                nt: 217,
                                taxon_name: "Klebsiella",
                                percent_identity: 99.7014,
                                alignment_length: 149.424,
                                e_value: -89.5822,
                              }, {
                                tax_level: 2,
                                nr: 87,
                                taxon_name: "Klebsiella",
                                percent_identity: 97.9598,
                                alignment_length: 46.4253,
                                e_value: -16.9874,
                              },])

      samples = Sample.where(id: [@sample1.id])
      @response = TopTaxonsSqlService.call(samples, mock_background_id, min_reads: 0)
    end

    it "should return the samples' pipeline run" do
      expect(@response[@pipeline_run1.id]["pr"]).to eq(@pipeline_run1)
    end

    it "should return the samples' taxon count" do
      taxon_counts = @response[@pipeline_run1.id]["taxon_counts"]
      expected_taxon_counts = {
        # Data related to ReportHelper::PROPERTIES_OF_TAXID
        rank: 1,
        current_id: @pipeline_run1.id,
        pipeline_run_id: @pipeline_run1.id,
        tax_id: 570,
        count_type: "NT",
        tax_level: 2,
        genus_taxid: 570,
        family_taxid: -300,
        name: "Klebsiella",
        superkingdom_taxid: 2,
        is_phage: 0,
        # Data related to ReportHelper::METRICS
        r: 217,
        stdev: nil,
        mean: nil,
        stdev_mass_normalized: nil,
        mean_mass_normalized: nil,
        percentidentity: 99.7014,
        alignmentlength: 149.424,
        logevalue: -89.58219909667969,
        rpm: 193_404.63458110514,
        zscore: 100.0,
      }

      expect(taxon_counts[0]).to include_json(expected_taxon_counts)
    end

    it "should return NT and NR counts for all taxons" do
      taxon_counts = @response[@pipeline_run1.id]["taxon_counts"]
      expect(taxon_counts.count).to eq(4)
    end

    it "should return the samples' ids" do
      expect(@response[@pipeline_run1.id]["sample_id"]).to eq(@sample1.id)
    end
  end

  context "when workflow is long-read-mngs" do
    let(:workflow) { WorkflowRun::WORKFLOW[:long_read_mngs] }

    before do
      @sample1 = create(:sample, project: create(:project), initial_workflow: workflow)
      @pipeline_run1 = create(:pipeline_run,
                              sample: @sample1,
                              total_reads: 1122,
                              total_bases: 1_122_000,
                              adjusted_remaining_reads: 316, # no bases equivalent
                              subsample: 100_000,
                              fraction_subsampled_bases: 1.0,
                              taxon_counts_data: [{
                                tax_level: 1,
                                taxon_name: "Klebsiella pneumoniae",
                                nt_base: 500_000,
                                percent_identity: 99.6995,
                                alignment_length: 1149.402,
                                e_value: -89.5641,
                              }, {
                                tax_level: 1,
                                taxon_name: "Klebsiella pneumoniae",
                                nr_base: 370_000,
                                percent_identity: 97.8565,
                                alignment_length: 460.3623,
                                e_value: -16.9101,
                              }, {
                                tax_level: 2,
                                nt_base: 550_000,
                                taxon_name: "Klebsiella",
                                percent_identity: 99.7014,
                                alignment_length: 1490.424,
                                e_value: -89.5822,
                              }, {
                                tax_level: 2,
                                nr_base: 400_000,
                                taxon_name: "Klebsiella",
                                percent_identity: 97.9598,
                                alignment_length: 460.4253,
                                e_value: -16.9874,
                              },])
      samples = Sample.where(id: [@sample1.id])
      nil_background_id = nil
      @response = TopTaxonsSqlService.call(samples, nil_background_id, min_reads: 0)
    end

    it "should return the samples' pipeline run" do
      expect(@response[@pipeline_run1.id]["pr"]).to eq(@pipeline_run1)
    end

    it "should return the samples' taxon count" do
      taxon_counts = @response[@pipeline_run1.id]["taxon_counts"]
      expected_taxon_counts = {
        # Data related to ReportHelper::PROPERTIES_OF_TAXID
        rank: 1,
        current_id: @pipeline_run1.id,
        pipeline_run_id: @pipeline_run1.id,
        tax_id: 570,
        tax_level: 2,
        genus_taxid: 570,
        family_taxid: -300,
        name: "Klebsiella",
        superkingdom_taxid: 2,
        is_phage: 0,
        # Data related to ReportHelper::METRICS
        count_type: "NT",
        b: 550_000,
        percentidentity: 99.7014,
        alignmentlength: 1490.42,
        logevalue: -89.58219909667969,
        bpm: 490_196.07843137253,
      }

      expect(taxon_counts[0]).to include_json(expected_taxon_counts)
    end

    it "should return the samples' ids" do
      expect(@response[@pipeline_run1.id]["sample_id"]).to eq(@sample1.id)
    end
  end
end
