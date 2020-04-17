class RapsearchToRapsearch2 < ActiveRecord::Migration[5.1]
  def change
    rename_column :pipeline_runs, :completed_rapsearch_chunks, :completed_rapsearch2_chunks
  end
end
