class RemoveChunkCountsFromPipelineRuns < ActiveRecord::Migration[5.1]
  def change
    remove_columns :pipeline_runs, :completed_rapsearch2_chunks, :completed_gsnap_chunks
  end
end
