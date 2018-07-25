class AddPipelineRunIdToAmrCount < ActiveRecord::Migration[5.1]
  def change
    add_column :amr_counts, :pipeline_run_id, :bigint
  end
end
