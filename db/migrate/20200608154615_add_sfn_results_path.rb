class AddSfnResultsPath < ActiveRecord::Migration[5.2]
  def change
    add_column :pipeline_runs, :sfn_results_path, :string, comment: "The path to the results folder in s3."
  end
end
