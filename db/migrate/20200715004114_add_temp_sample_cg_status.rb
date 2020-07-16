class AddTempSampleCgStatus < ActiveRecord::Migration[5.2]
  def change
    change_table :samples, bulk: true do |t|
      t.string :temp_sfn_execution_status, comment: "Step Function execution status for samples using temp_pipeline_workflow=consensus_genome. To be removed when temp_pipeline_workflow is moved."
      t.string :temp_wdl_version, comment: "WDL version for samples using temp_pipeline_workflow=consensus_genome. To be removed when temp_pipeline_workflow is moved."
    end
  end
end
