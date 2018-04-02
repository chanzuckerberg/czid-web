class AddKingdomToTaxonLineages < ActiveRecord::Migration[5.1]
  def change
    add_column :taxon_lineages, :kingdom_taxid, :integer
    add_column :taxon_lineages, :kingdom_name, :string
    add_column :taxon_lineages, :kingdom_common_name, :string
  end
end
