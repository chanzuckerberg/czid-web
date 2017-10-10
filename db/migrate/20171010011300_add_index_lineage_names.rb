class AddIndexLineageNames < ActiveRecord::Migration[5.1]
  def change
    add_index :taxon_lineage_names, :taxid, unique: true
  end
end
