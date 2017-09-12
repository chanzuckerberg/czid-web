class RenameNtRpmToRpm < ActiveRecord::Migration[5.1]
  def change
    rename_column :taxon_zscores, :nt_rpm, :rpm
  end
end
