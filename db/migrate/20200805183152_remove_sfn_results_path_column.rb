class RemoveSfnResultsPathColumn < ActiveRecord::Migration[5.2]
  def change
    remove_column :pipeline_runs, :sfn_results_path
  end
end
