class AddSubsampleToPipelineRun < ActiveRecord::Migration[5.1]
  def change
    add_column :pipeline_runs, :subsample, :integer
  end
end
