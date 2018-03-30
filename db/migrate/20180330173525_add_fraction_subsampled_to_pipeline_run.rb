class AddFractionSubsampledToPipelineRun < ActiveRecord::Migration[5.1]
  def change
    add_column :pipeline_runs, :fraction_subsampled, :float
  end
end
