class AddPostprocessStatusToPipelineRun < ActiveRecord::Migration[5.1]
  def change
    add_column :pipeline_runs, :postprocess_status, :string
  end
end
