class AddWdlVersionToPipelineRun < ActiveRecord::Migration[5.2]
  def change
    add_column :pipeline_runs, :wdl_version, :string
  end
end
