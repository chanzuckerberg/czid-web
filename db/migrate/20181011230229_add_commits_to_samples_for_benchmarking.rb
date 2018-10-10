class AddCommitsToSamplesForBenchmarking < ActiveRecord::Migration[5.1]
  def change
    add_column :samples, :web_commit, :string, null: "", default: ""
    add_column :samples, :pipeline_commit, :string, null: "", default: ""
  end
end
