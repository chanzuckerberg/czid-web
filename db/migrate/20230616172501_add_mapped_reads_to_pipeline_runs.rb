class AddMappedReadsToPipelineRuns < ActiveRecord::Migration[6.1]
  def change
    add_column :pipeline_runs, :mapped_reads, :integer
  end
end
