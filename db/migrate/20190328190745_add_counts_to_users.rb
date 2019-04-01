class AddCountsToUsers < ActiveRecord::Migration[5.1]
  def change
    add_column :users, :samples_count, :integer, default: 0, null: false
    add_column :users, :favorite_projects_count, :integer, default: 0, null: false
    add_column :users, :favorites_count, :integer, default: 0, null: false
    add_column :users, :visualizations_count, :integer, default: 0, null: false
    add_column :users, :phylo_trees_count, :integer, default: 0, null: false
  end
end
