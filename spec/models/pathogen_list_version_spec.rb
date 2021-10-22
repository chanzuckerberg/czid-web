require 'rails_helper'

describe PathogenListVersion, type: :model do
  before do
    global_list = create(:pathogen_list, creator_id: nil, is_global: true)
    @list_version = create(:pathogen_list_version, version: "0.1.0", pathogen_list_id: global_list.id)
    @citation = create(:citation, key: "test_key", footnote: "test_footnote")
  end

  context "#fetch_citation_footnotes" do
    it "should return an empty array for empty list versions" do
      expect(@list_version.fetch_citation_footnotes).to eq([])
    end

    it "should return the correct, unique footnotes" do
      pathogen_a = create(:pathogen, citation_id: @citation.id, tax_id: 1)
      pathogen_b = create(:pathogen, citation_id: @citation.id, tax_id: 2)
      @list_version.pathogens << pathogen_a
      @list_version.pathogens << pathogen_b
      expect(@list_version.fetch_citation_footnotes).to eq([@citation.footnote])
    end
  end

  context "#fetch_pathogens_info" do
    it "should return an empty array if the list version is empty" do
      expect(@list_version.fetch_pathogens_info).to eq([])
    end

    it "should return the correct pathogens information" do
      pathogen_a = create(:pathogen, citation_id: @citation.id, tax_id: 1)
      pathogen_b = create(:pathogen, citation_id: @citation.id, tax_id: 2)
      species_a = create(:taxon_lineage, tax_name: "species a", taxid: 1, species_taxid: 1, species_name: "species a", superkingdom_name: "superkingdom_a")
      species_b = create(:taxon_lineage, tax_name: "species a", taxid: 2, species_taxid: 2, species_name: "species b", superkingdom_name: "superkingdom_b")
      @list_version.pathogens << pathogen_a
      @list_version.pathogens << pathogen_b

      result = @list_version.fetch_pathogens_info
      expected = [
        {
          category: species_a.superkingdom_name,
          name: species_a.species_name,
          tax_id: species_a.taxid,
        },
        {
          category: species_b.superkingdom_name,
          name: species_b.species_name,
          tax_id: species_b.taxid,
        },
      ]
      expect(result).to eq(expected)
    end
  end
end
