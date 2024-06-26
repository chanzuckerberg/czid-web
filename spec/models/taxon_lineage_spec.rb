require 'rails_helper'

RSpec.describe TaxonLineage, type: :model do
  context "#versioned_lineages" do
    let(:taxid) { 100 }
    before do
      @taxon_lineage_one = create(:taxon_lineage, taxid: taxid, version_start: "2022-01-02", version_end: "2022-01-04")
      @taxon_lineage_two = create(:taxon_lineage, taxid: taxid, version_start: "2022-01-05", version_end: "2022-01-07")
    end

    it "fetches the correct lineage" do
      taxon_lineages = TaxonLineage.versioned_lineages(taxid, "2022-01-05")
      expect(taxon_lineages.length).to eq(1)
      expect(taxon_lineages[0].id).to eq(@taxon_lineage_two.id)
    end

    it "returns empty relation if no match" do
      taxon_lineages = TaxonLineage.versioned_lineages(taxid, "2022-01-10")
      expect(taxon_lineages.length).to eq(0)
    end
  end
end
