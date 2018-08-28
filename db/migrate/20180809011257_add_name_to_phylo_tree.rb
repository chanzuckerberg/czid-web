class AddNameToPhyloTree < ActiveRecord::Migration[5.1]
  def change
    add_column :phylo_trees, :name, :string
    add_index :phylo_trees, :name, unique: true
  end
end
