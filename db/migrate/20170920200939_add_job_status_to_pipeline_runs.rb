class AddJobStatusToPipelineRuns < ActiveRecord::Migration[5.1]
  def change
    add_column :pipeline_runs, :job_status, :string
    add_column :pipeline_runs, :job_description, :text
    add_column :pipeline_runs, :job_log_id, :string
    add_index  :pipeline_runs, :job_status
  end
end
