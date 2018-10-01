class AddIndexOnGenusTaxidAndName < ActiveRecord::Migration[5.1]
  def change
    remove_index :taxon_lineages, :genus_taxid
    add_index :taxon_lineages, [:genus_taxid, :genus_name]
  end
end
