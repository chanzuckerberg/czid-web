require 'rails_helper'

RSpec.describe TaxonLineage, type: :model do
  context "#versioned_lineages" do
    let(:taxid) { 100 }
    before do
      @taxon_lineage_one = create(:taxon_lineage, taxid: taxid, version_start: 2, version_end: 4)
      @taxon_lineage_two = create(:taxon_lineage, taxid: taxid, version_start: 5, version_end: 7)
    end

    it "fetches the correct lineage" do
      taxon_lineages = TaxonLineage.versioned_lineages(taxid, 5)
      expect(taxon_lineages.length).to eq(1)
      expect(taxon_lineages[0].id).to eq(@taxon_lineage_two.id)
    end

    it "returns empty relation if no match" do
      taxon_lineages = TaxonLineage.versioned_lineages(taxid, 10)
      expect(taxon_lineages.length).to eq(0)
    end
  end

  context "#fetch_category_by_taxid" do
    before do
      @taxon_lineage_one = create(:taxon_lineage, taxid: 1, superkingdom_name: "category_1")
      @taxon_lineage_two = create(:taxon_lineage, taxid: 2, superkingdom_name: "category_2")
    end

    it "returns empty hash if no taxids provided" do
      result = TaxonLineage.fetch_category_by_taxid([])
      expected = {}
      expect(result).to eq(expected)
    end

    it "fetches the correct taxid-to-category hash" do
      result = TaxonLineage.fetch_category_by_taxid([1, 2])
      expected = { 1 => "category_1", 2 => "category_2" }
      expect(result).to eq(expected)
    end
  end
end
