class ChangeTaxonLineagesAndNames < ActiveRecord::Migration[5.1]
  def change
    change_column :taxon_lineages, :taxid, :integer, null: false
    change_column :taxon_lineages, :superkingdom_taxid, :integer, null: false
    change_column :taxon_names, :taxid, :integer, null: false
  end
end
