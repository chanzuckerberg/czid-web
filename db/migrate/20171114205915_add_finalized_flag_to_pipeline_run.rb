class AddFinalizedFlagToPipelineRun < ActiveRecord::Migration[5.1]
  def change
    add_column :pipeline_runs, :finalized, :integer, limit:4, null:false, default: 0
  end
end
