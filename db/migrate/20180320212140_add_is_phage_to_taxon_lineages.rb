class AddIsPhageToTaxonLineages < ActiveRecord::Migration[5.1]
  def change
    add_column :taxon_counts, :is_phage, :tinyint, null:false, default: 0
  end
end
