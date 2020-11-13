require 'rails_helper'

DEFAULT_MOCK_TAXON_COUNT_ENTRY = {
  percent_identity: 96.9,
  alignment_length: 32.0,
  e_value: -9.3,
  superkingdom_taxid: 2,
}.freeze

def create_pipeline_run(
  total_reads:, sample:, taxon_counts:
)
  taxon_counts_data = taxon_counts.map do |taxon_counts_hash|
    DEFAULT_MOCK_TAXON_COUNT_ENTRY.merge(taxon_counts_hash)
  end

  create(:pipeline_run,
         sample: sample,
         sfn_execution_arn: CommonStubConstants::FAKE_SFN_EXECUTION_ARN,
         job_status: "CHECKED",
         finalized: 1,
         total_reads: total_reads,
         adjusted_remaining_reads: total_reads,
         subsample: 1_000_000,
         taxon_counts_data: taxon_counts_data)
end

RSpec.describe TaxonCountsHeatmapService do
  let(:background) { nil }
  let(:background_id) { background && background.id }
  let(:max_top_taxa) { 3 }
  let(:max_total_taxa) { 10 }
  let(:min_reads) { 0 }
  let(:heatmap) { TaxonCountsHeatmapService.call(pipeline_run_ids: @pipeline_runs.pluck(:id), background_id: background_id, min_reads: min_reads) }

  before do
    @genus_a = create(:taxon_lineage, tax_name: "genus A", taxid: 10, genus_taxid: 10, genus_name: "genus A", superkingdom_taxid: 2)
    @genus_b = create(:taxon_lineage, tax_name: "genus B", taxid: 20, genus_taxid: 20, genus_name: "genus B", superkingdom_taxid: 2)
    @genus_c = create(:taxon_lineage, tax_name: "genus C", taxid: 30, genus_taxid: 30, genus_name: "genus C", superkingdom_taxid: 2)

    @species_a1 = create(:taxon_lineage, tax_name: "species A.1", taxid: 1, species_taxid: 1, species_name: "species A.1", genus_taxid: @genus_a.taxid, genus_name: @genus_a.name, superkingdom_taxid: 2)
    @species_a2 = create(:taxon_lineage, tax_name: "species A.2", taxid: 2, species_taxid: 2, species_name: "species A.2", genus_taxid: @genus_a.taxid, genus_name: @genus_a.name, superkingdom_taxid: 2)
    @species_b3 = create(:taxon_lineage, tax_name: "species B.3", taxid: 3, species_taxid: 2, species_name: "species B.3", genus_taxid: @genus_b.taxid, genus_name: @genus_b.name, superkingdom_taxid: 2)
    @species_b4 = create(:taxon_lineage, tax_name: "species B.4", taxid: 4, species_taxid: 2, species_name: "species B.4", genus_taxid: @genus_b.taxid, genus_name: @genus_b.name, superkingdom_taxid: 2)
    @species_c5 = create(:taxon_lineage, tax_name: "species C.5", taxid: 5, species_taxid: 2, species_name: "species C.5", genus_taxid: @genus_c.taxid, genus_name: @genus_c.name, superkingdom_taxid: 2)

    @project = create(:project)
    @samples = [
      create(:sample, project: @project, name: "sample 1"),
      create(:sample, project: @project, name: "sample 2"),
      create(:sample, project: @project, name: "sample 3"),
    ]

    # create 3 pipeline_runs with tax count data
    @pipeline_runs = [
      create_pipeline_run(sample: @samples[0], total_reads: 100, taxon_counts: [
                            { taxon_name: @species_a1.tax_name, tax_level: 1, nt: 70 },
                            { taxon_name: @species_a1.tax_name, tax_level: 1, nr: 10 },
                            { taxon_name: @species_a2.tax_name, tax_level: 1, nt: 20 },
                            { taxon_name: @species_a2.tax_name, tax_level: 1, nr: 40 },
                            { taxon_name: @species_b3.tax_name, tax_level: 1, nt: 10 },
                            { taxon_name: @species_b3.tax_name, tax_level: 1, nr: 50 },
                            { taxon_name: @genus_a.tax_name, tax_level: 2, nt: 90 },
                            { taxon_name: @genus_a.tax_name, tax_level: 2, nr: 50 },
                            { taxon_name: @genus_b.tax_name, tax_level: 2, nt: 10 },
                            { taxon_name: @genus_b.tax_name, tax_level: 2, nr: 50 },
                          ]),
      create_pipeline_run(sample: @samples[1], total_reads: 100, taxon_counts: [
                            { taxon_name: @species_a1.tax_name, tax_level: 1, nt: 20 },
                            { taxon_name: @species_a1.tax_name, tax_level: 1, nr: 40 },
                            { taxon_name: @species_a2.tax_name, tax_level: 1, nt: 50 },
                            { taxon_name: @species_b3.tax_name, tax_level: 1, nt: 20 },
                            { taxon_name: @species_b3.tax_name, tax_level: 1, nr: 60 },
                            { taxon_name: @species_b4.tax_name, tax_level: 1, nt: 10 },
                            { taxon_name: @genus_a.tax_name, tax_level: 2, nt: 70 },
                            { taxon_name: @genus_a.tax_name, tax_level: 2, nr: 40 },
                            { taxon_name: @genus_b.tax_name, tax_level: 2, nt: 30 },
                            { taxon_name: @genus_b.tax_name, tax_level: 2, nr: 60 },
                          ]),
      create_pipeline_run(sample: @samples[2], total_reads: 100, taxon_counts: [
                            { taxon_name: @species_a1.tax_name, tax_level: 1, nt: 20 },
                            { taxon_name: @species_a1.tax_name, tax_level: 1, nr: 10 },
                            { taxon_name: @species_a2.tax_name, tax_level: 1, nt: 10 },
                            { taxon_name: @species_a2.tax_name, tax_level: 1, nr: 40 },
                            { taxon_name: @species_c5.tax_name, tax_level: 1, nr: 50 },
                            { taxon_name: @genus_a.tax_name, tax_level: 2, nt: 30 },
                            { taxon_name: @genus_a.tax_name, tax_level: 2, nr: 50 },
                            { taxon_name: @genus_c.tax_name, tax_level: 2, nr: 50 },
                          ]),
    ]

    stub_const("TaxonCountsHeatmapService::DEFAULT_MAX_NUM_TOP_TAXA_PER_SAMPLE", max_top_taxa)
    stub_const("TaxonCountsHeatmapService::DEFAULT_MAX_TOTAL_TAXA", max_total_taxa)

    if background
      # since we are just testing for inclusion of background based metrics we use similar background for all taxa
      [@species_a1, @species_a2, @species_b3, @species_b4, @species_c5, @genus_a, @genus_b, @genus_c].each do |taxon|
        create(:taxon_summary, background: background, tax_id: taxon.taxid, count_type: TaxonCount::COUNT_TYPE_NT, tax_level: taxon.tax_level, mean: 50 * 1E6 / 1E2, stdev: 10 * 1E6 / 1E2)
        create(:taxon_summary, background: background, tax_id: taxon.taxid, count_type: TaxonCount::COUNT_TYPE_NR, tax_level: taxon.tax_level, mean: 50 * 1E6 / 1E2, stdev: 10 * 1E6 / 1E2)
      end
    end
  end

  context "with no background" do
    it "returns all object keys" do
      expect(heatmap).to include(:metadata, :samples, :taxa, :results, :result_keys)
    end

    context "when max_total_taxa is large" do
      let(:max_top_taxa) { 3 }
      let(:max_total_taxa) { 1000 }

      it "returns top taxa per counts " do
        selected_taxa = heatmap[:taxa].pluck(:name)
        # max taxa pipeline run 1: genus_a (rank 1), species_a1 (rank 2), species_b3 (rank 3), genus_b (rank 3)
        # max taxa pipeline run 2: genus_a (rank 1), species_b3 (rank 2), genus_b (rank 2),
        # max taxa pipeline run 3: species_c5 (rank 1), genus_a (rank 1), genus_c (rank 1),
        expect(selected_taxa).to contain_exactly(
          @species_a1.name,
          @species_b3.name,
          @species_c5.name,
          @genus_a.name,
          @genus_b.name,
          @genus_c.name
        )
      end

      it "returns samples and pipeline run information" do
        expect(heatmap[:samples]).to contain_exactly(
          *@samples.map do |sample|
            pr = sample.pipeline_runs.first
            {
              id: sample.id,
              name: sample.name,
              metadata: [],
              host_genome_name: sample.host_genome_name,
              pipeline_run: { id: pr.id, pipeline_version: pr.pipeline_version, ercc_count: pr.total_ercc_reads },
            }
          end
        )
      end

      it "returns taxa information" do
        expect(heatmap[:taxa]).to contain_exactly(
          *[@species_a1, @species_b3, @species_c5, @genus_a, @genus_b, @genus_c].map do |taxon|
            common_name = taxon.tax_level == TaxonCount::TAX_LEVEL_SPECIES ? taxon.species_common_name : taxon.genus_common_name
            {
              tax_id: taxon.taxid,
              name: taxon.tax_name,
              common_name: common_name.presence,
              tax_level: taxon.tax_level,
              genus_tax_id: taxon.genus_taxid,
              genus_name: taxon.genus_name,
              family_tax_id: taxon.family_taxid,
              category_name: TaxonLineage::CATEGORIES[taxon.superkingdom_taxid],
              is_phage: 0, # Not yet tested
            }
          end
        )
      end

      it "does not load background-based metrics" do
        # get indices for the metrics
        metric_index = heatmap[:result_keys].map.with_index.to_h

        # checking only one case for presence and correctness
        expect(heatmap[:results][@samples[0].id][@species_a1.taxid][TaxonCount::COUNT_TYPE_NT][metric_index[:zscore]]).to be_nil
        # (mean - count) / std_dev = (10 - 50) / 10 = -4
        expect(heatmap[:results][@samples[0].id][@species_a1.taxid][TaxonCount::COUNT_TYPE_NR][metric_index[:zscore]]).to be_nil
      end
    end

    context "when max_total_taxa is lower than number of taxa from top taxa" do
      let(:max_top_taxa) { 3 }
      let(:max_total_taxa) { 3 }

      it "returns top taxa per counts" do
        selected_taxa = heatmap[:taxa].pluck(:name)
        # Final taxa is restricted  max total number of taxa (ties are included)
        # All rank 1 from previous run: genus_a, genus_c, species_c5 -> total 3
        expect(selected_taxa).to contain_exactly(
          @species_c5.name,
          @genus_a.name,
          @genus_c.name
        )
      end
    end
  end

  context "non existent background" do
    let(:background_id) { 123_456 }

    it "raise an error if background does not exist" do
      expect { heatmap }.to raise_exception(ActiveRecord::RecordNotFound)
    end
  end

  context "with background" do
    let(:background) { create(:background, name: "test", public_access: 1, pipeline_runs: @pipeline_runs) }

    it "includes background metrics" do
      # get indices for the metrics
      metric_index = heatmap[:result_keys].map.with_index.to_h

      # checking only one case for presence and correctness
      # (mean - count) / std_dev = (70 - 50) / 10 = 2
      expect(heatmap[:results][@samples[0].id][@species_a1.taxid][TaxonCount::COUNT_TYPE_NT][metric_index[:zscore]]).to eq(2)
      # (mean - count) / std_dev = (10 - 50) / 10 = -4
      expect(heatmap[:results][@samples[0].id][@species_a1.taxid][TaxonCount::COUNT_TYPE_NR][metric_index[:zscore]]).to eq(-4)
    end
  end

  context "with min reads set" do
    let(:min_reads) { 65 }

    it "include only taxon counts with more reads than min_reads" do
      selected_taxa = heatmap[:taxa].pluck(:name)
      # max taxa pipeline run 1: genus_a (rank 1), species_a1 (rank 2), species_b3 (rank 3), genus_b (rank 3)
      # max taxa pipeline run 2: genus_a (rank 1), species_b3 (rank 2), genus_b (rank 2),
      # max taxa pipeline run 3: species_c5 (rank 1), genus_a (rank 1), genus_c (rank 1),
      expect(selected_taxa).to contain_exactly(
        @species_a1.name,
        @genus_a.name
      )
    end
  end
end
