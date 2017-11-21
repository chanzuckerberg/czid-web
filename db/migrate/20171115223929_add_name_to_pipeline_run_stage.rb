class AddNameToPipelineRunStage < ActiveRecord::Migration[5.1]
  def change
    add_column :pipeline_run_stages, :name, :string
  end
end
