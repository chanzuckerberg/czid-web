class ChangeZscoreType < ActiveRecord::Migration[5.1]
  def change
    change_column :taxon_zscores, :nt_zscore, :float 
  end
end
