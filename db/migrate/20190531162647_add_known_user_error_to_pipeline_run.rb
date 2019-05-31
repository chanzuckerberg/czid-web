class AddKnownUserErrorToPipelineRun < ActiveRecord::Migration[5.1]
  def change
    add_column :pipeline_runs, :known_user_error, :string
  end
end
