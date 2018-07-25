class CreatePhyloTrees < ActiveRecord::Migration[5.1]
  def up
    create_table :phylo_trees do |t|
      t.string :name
      t.text :description
      t.bigint :user_id
      t.bigint :project_id
      t.timestamps
      t.index :user_id
    end

    create_table :phylo_trees_pipeline_runs do |t|
      t.bigint :phylo_tree_id
      t.bigint :pipeline_run_id
      t.index [:phylo_tree_id, :pipeline_run_id], name: :index_pt_pr_id, unique: true
    end
  end

  def down
    drop_table :phylo_trees
    drop_table :phylo_trees_pipeline_runs
  end
end
