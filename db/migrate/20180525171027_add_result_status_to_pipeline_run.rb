class AddResultStatusToPipelineRun < ActiveRecord::Migration[5.1]
  def change
    add_column :pipeline_runs, :result_status, :string
  end
end
