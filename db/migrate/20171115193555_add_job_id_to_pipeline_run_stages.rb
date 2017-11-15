class AddJobIdToPipelineRunStages < ActiveRecord::Migration[5.1]
  def change
    add_column :pipeline_run_stages, :job_id, :string
    add_column :pipeline_run_stages, :output_func, :string
  end
end
