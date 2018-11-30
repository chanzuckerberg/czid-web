class AddCompletedGsnapChunksToPipelineRuns < ActiveRecord::Migration[5.1]
  def change
    add_column :pipeline_runs, :completed_gsnap_chunks, :integer
    add_column :pipeline_runs, :completed_rapsearch_chunks, :integer
  end
end
