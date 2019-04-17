class AddErrorMessageToPipelineRun < ActiveRecord::Migration[5.1]
  def change
    add_column :pipeline_runs, :error_message, :text
  end
end
