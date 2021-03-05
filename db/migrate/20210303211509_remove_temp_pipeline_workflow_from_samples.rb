class RemoveTempPipelineWorkflowFromSamples < ActiveRecord::Migration[5.2]
  def up
    remove_column :samples, :temp_pipeline_workflow, :string
  end

  def down
    change_table :samples, bulk: true do |t|
      t.string :temp_pipeline_workflow, :string, default: "short-read-mngs", null: false, comment: "A soft enum (string) describing which pipeline workflow should run. Main is the classic mNGS pipeline. To be moved to a pipeline run model."
      t.index :temp_pipeline_workflow
    end

    Sample.update_all("temp_pipeline_workflow = initial_workflow") # rubocop:disable Rails/SkipsModelValidations
  end
end
