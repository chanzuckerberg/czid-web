class AddConsensusColumns < ActiveRecord::Migration[5.2]
  def change
    change_table :samples, bulk: true do |t|
      t.string :temp_pipeline_workflow, default: "main", null: false, comment: "A soft enum (string) describing which pipeline workflow should run. Main is the classic mNGS pipeline. To be moved to a pipeline run model."
      t.string :temp_sfn_execution_arn, comment: "Step Function execution ARN for samples using temp_pipeline_workflow=consensus_genome. To be removed when temp_pipeline_workflow is moved."
    end
  end
end
