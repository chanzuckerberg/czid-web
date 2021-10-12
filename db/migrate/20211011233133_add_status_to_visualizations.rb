class AddStatusToVisualizations < ActiveRecord::Migration[6.1]
  def up
    add_column :visualizations, :status, :string, comment: "A soft enum (string) describing the execution status. Currently only applicable to phylo trees."

    Visualization.where(visualization_type: Visualization::PHYLO_TREE_NG_TYPE).each do |vis|
      tree_id = vis.data["treeNgId"]
      status = PhyloTreeNg.find(tree_id).status
      vis.update(status: status)
    end
  end

  def down
    remove_column :visualizations, :status
  end
end
