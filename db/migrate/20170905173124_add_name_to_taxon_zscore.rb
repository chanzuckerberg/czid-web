class AddNameToTaxonZscore < ActiveRecord::Migration[5.1]
  def change
    add_column :taxon_zscores, :name, :string
  end
end
