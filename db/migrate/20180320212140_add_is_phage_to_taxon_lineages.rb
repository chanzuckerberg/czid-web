class AddIsPhageToTaxonLineages < ActiveRecord::Migration[5.1]
  def change
    add_column :taxon_lineages, :is_phage, :tinyint
  end
end
