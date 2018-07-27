class CreatePhyloTrees < ActiveRecord::Migration[5.1]
  def up
    create_table :phylo_trees do |t|
      t.integer :taxid
      t.integer :tax_level
      t.bigint :user_id
      t.bigint :project_id
      t.text :newick
      t.integer :status, default: 0
      t.string :dag_version
      t.text :dag_json
      t.text :command_stdout
      t.text :command_stderr
      t.string :job_id
      t.string :job_log_id
      t.text :job_description
      t.timestamps
      t.index :user_id
      t.index [:project_id, :taxid]
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
