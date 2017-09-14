class AddHitTypeToTaxonZscore < ActiveRecord::Migration[5.1]
  def change
    add_column :taxon_zscores, :hit_type, :string
  end
end
