class AddPipelineVersionToPipelineRun < ActiveRecord::Migration[5.1]
  def change
    add_column :pipeline_runs, :pipeline_version, :string
  end
end
