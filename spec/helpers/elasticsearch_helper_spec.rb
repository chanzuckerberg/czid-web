require "rails_helper"
require "webmock/rspec"

RSpec.describe ElasticsearchHelper, type: :helper do
  describe "#fetch_taxon_data" do
    before do
      # lineages added in 2024
      @taxon_lineage1 = create(:taxon_lineage, taxid: 1, species_taxid: 100, species_name: "species1 2024", genus_name: "genus1", version_start: "2024-02-06", version_end: "2024-02-06")
      @taxon_lineage2 = create(:taxon_lineage, taxid: 2, species_taxid: 200, species_name: "species2 2024", genus_name: "genus2", version_start: "2024-02-06", version_end: "2024-02-06")
      @taxon_lineage3 = create(:taxon_lineage, taxid: 3, species_taxid: 300, species_name: "species3 2024", genus_name: "genus3", version_start: "2024-02-06", version_end: "2024-02-06")

      # "lineages added in 2021 that are valid through 2022"
      @taxon_lineage4 = create(:taxon_lineage, taxid: 4, species_taxid: 300, species_name: "species3 2021", genus_name: "genus3", version_start: "2021-01-22", version_end: "2022-02-06")
    end

    context "when there are multiple taxid versions" do
      it "returns the most recent matching taxa that includes the ncbi_version" do
        taxon_ids = [100, 200, 300]
        ncbi_version = "2024-02-06"
        level = "species"
        matching_taxa = fetch_taxon_data(taxon_ids, ncbi_version, level)

        expected_results = [
          { "title" => "species1 2024", "description" => "Taxonomy ID: 100", "taxid" => 100, "level" => "species" },
          { "title" => "species2 2024", "description" => "Taxonomy ID: 200", "taxid" => 200, "level" => "species" },
          { "title" => "species3 2024", "description" => "Taxonomy ID: 300", "taxid" => 300, "level" => "species" },
        ]
        expect(matching_taxa).to eq expected_results
      end

      it "returns the older version based on the ncbi_version" do
        taxon_ids = [300]
        ncbi_version = "2021-01-22"
        level = "species"
        matching_taxa = fetch_taxon_data(taxon_ids, ncbi_version, level)

        expected_results = [
          { "title" => "species3 2021", "description" => "Taxonomy ID: 300", "taxid" => 300, "level" => "species" },
        ]
        expect(matching_taxa).to eq expected_results
      end
    end
  end

  context "when the taxid falls outside of the ncbi_version" do
    it "returns an empty array" do
      taxon_ids = [100, 200, 300]
      ncbi_version = "2025-02-06"
      level = "species"
      matching_taxa = fetch_taxon_data(taxon_ids, ncbi_version, level)

      expect(matching_taxa).to eq []
    end
  end
end
