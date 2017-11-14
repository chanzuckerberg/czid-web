class AddUniquenessToTaxonByteranges < ActiveRecord::Migration[5.1]
  def change
    remove_index :taxon_byteranges, name: "index_taxon_byteranges_on_details"
    add_index :taxon_byteranges, ["pipeline_output_id", "tax_level", "hit_type", "taxid"], unique: true, name: "index_taxon_byteranges_on_details"
  end
end
