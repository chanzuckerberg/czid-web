class AddFailedJobsToPipelineRunStage < ActiveRecord::Migration[5.1]
  def change
    add_column :pipeline_run_stages, :failed_jobs, :text
  end
end
