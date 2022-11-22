class AddIndicesToPipelineRunBaseMetrics < ActiveRecord::Migration[6.1]
  def change
    add_index :pipeline_runs, :total_bases
    add_index :pipeline_runs, :fraction_subsampled_bases
  end
end
