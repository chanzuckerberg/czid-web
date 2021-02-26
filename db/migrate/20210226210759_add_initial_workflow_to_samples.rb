class AddInitialWorkflowToSamples < ActiveRecord::Migration[5.2]
  def up
    add_column :samples, :initial_workflow, :string, default: "short-read-mngs", null: false, comment: "A soft enum (string) describing the initial workflow the sample was run on"
    Sample.update_all("initial_workflow = temp_pipeline_workflow") # rubocop:disable Rails/SkipsModelValidations
  end

  def down
    remove_column :samples, :initial_workflow
  end
end
