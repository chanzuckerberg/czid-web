class AddPipelineBranchToSample < ActiveRecord::Migration[5.1]
  def change
    add_column :samples, :pipeline_branch, :string
    add_column :pipeline_runs, :pipeline_branch, :string
  end
end
