class AddNtRpmToTaxonZscore < ActiveRecord::Migration[5.1]
  def change
    add_column :taxon_zscores, :nt_rpm, :float
  end
end
