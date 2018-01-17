class AddVersionToPipelineRun < ActiveRecord::Migration[5.1]
  def change
    add_column :pipeline_runs, :version, :text
  end
end
