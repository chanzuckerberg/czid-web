class AddIndexOnLineageVersion < ActiveRecord::Migration[5.1]
  def change
    add_index :taxon_lineages, [:taxid, :version_start]
    add_index :taxon_lineages, [:taxid, :version_end]
    add_index :taxon_lineages, [:taxid, :version_start, :version_end]
  end
end
