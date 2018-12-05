class AddIndexOnLineageVersion < ActiveRecord::Migration[5.1]
  def change
    add_index :taxon_lineages, [:taxid, :version_start], unique: true
    add_index :taxon_lineages, [:taxid, :version_end], unique: true
    add_index :taxon_lineages, [:taxid, :version_start, :version_end], unique: true
  end
end
