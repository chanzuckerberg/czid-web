class AddTotalErccReadsToPipelineRun < ActiveRecord::Migration[5.1]
  def change
    add_column :pipeline_runs, :total_ercc_reads, :integer
  end
end
