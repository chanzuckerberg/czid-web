class AddWorkflowIndex < ActiveRecord::Migration[5.2]
  def change
    add_index :samples, :temp_pipeline_workflow
  end
end
