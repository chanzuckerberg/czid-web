class AddStepMapToPipelineRunStage < ActiveRecord::Migration[5.2]
  def change
    add_column :pipeline_run_stages, :step_map, :string
  end
end
