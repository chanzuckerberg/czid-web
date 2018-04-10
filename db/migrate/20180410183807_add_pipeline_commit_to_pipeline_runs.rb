class AddPipelineCommitToPipelineRuns < ActiveRecord::Migration[5.1]
  def change
    add_column :pipeline_runs, :pipeline_commit, :string
  end
end
