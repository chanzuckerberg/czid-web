class CreatePhyloTreeNgs < ActiveRecord::Migration[5.2]
  def change
    create_table :phylo_tree_ngs do |t|
      t.json :inputs_json, comment: "Generic JSON field for recording execution inputs."
      t.string :status, null: false, default: "CREATED", comment: "A soft enum (string) describing the execution status."
      t.string :wdl_version, comment: "Version of the WDL used in execution."
      t.string :sfn_execution_arn, comment: "Step Function execution ARN."
      t.string :s3_output_prefix, comment: "Record the SFN-WDL OutputPrefix used. Ex: 's3://bucket/phylo_trees/subpath/results' Never allow users to set this."
      t.datetime :executed_at, comment: "Self-managed field to track the time of kickoff and dispatch."
      t.boolean :deprecated, null: false, default: false, comment: "If true, don't surface the run to the user."
      t.bigint :rerun_from, comment: "Id of the phylo tree this was rerun from, if applicable"

      t.string :name, null: false, comment: "Name of the NG phylo tree"
      t.virtual :tax_id, type: :integer, as: "JSON_UNQUOTE(JSON_EXTRACT(inputs_json, '$.tax_id'))", comment: "Taxon id of interest"
      t.bigint :user_id, null: false
      t.bigint :project_id, null: false

      t.index :name
      t.index :user_id
      t.index [:project_id, :tax_id]

      t.timestamps
    end

    create_table :phylo_tree_ngs_pipeline_runs do |t|
      t.bigint :phylo_tree_ng_id
      t.bigint :pipeline_run_id
      t.index [:phylo_tree_ng_id, :pipeline_run_id], name: :index_ptng_pr_id, unique: true
      t.timestamps
    end
  end

  def down
    drop_table :phylo_tree_ngs
    drop_table :phylo_tree_ngs_pipeline_runs
  end
end
