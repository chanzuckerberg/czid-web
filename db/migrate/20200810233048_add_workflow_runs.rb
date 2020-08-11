class AddWorkflowRuns < ActiveRecord::Migration[5.2]
  def change
    create_table :workflow_runs do |t|
      t.references :sample, foreign_key: true
      t.string :status, null: false, default: "CREATED", comment: "A soft enum (string) describing the execution status."
      t.string :workflow, null: false, comment: "Name of the workflow to use, e.g. consensus-genome."
      t.string :wdl_version, comment: "Version of the WDL used in execution."
      t.string :dag_version, comment: "idseq-dag version. Legacy field needed for sfn_results_path for now."
      t.string :sfn_execution_arn, comment: "Step Function execution ARN."
      t.datetime :executed_at, comment: "Self-managed field to track the time of kickoff and dispatch."
      t.boolean :deprecated, null: false, default: false, comment: "If true, don't surface the run to the user."
      t.timestamps
    end
  end
end
