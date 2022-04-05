class BackfillVisualizationNames < ActiveRecord::Migration[6.1]
  def change
    heatmaps_with_no_name = Visualization.where(visualization_type: Visualization::HEATMAP_TYPE, name: nil)
    phylo_trees_with_no_name = Visualization.where(visualization_type: Visualization::PHYLO_TREE_TYPE, name: nil)
    report_tables_with_no_name = Visualization.where(visualization_type: Visualization::TABLE_TYPE, name: nil)
    taxon_trees_with_no_name = Visualization.where(visualization_type: Visualization::TREE_TYPE, name: nil)

    heatmaps_with_no_name.update(name: "Heatmap")
    phylo_trees_with_no_name.update(name: "Phylo Tree")
    report_tables_with_no_name.update(name: "Table")
    taxon_trees_with_no_name.update(name: "Tree")
  end
end
