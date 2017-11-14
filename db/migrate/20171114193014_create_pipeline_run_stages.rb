class CreatePipelineRunStages < ActiveRecord::Migration[5.1]
  def change
    create_table :pipeline_run_stages do |t|
      t.references :pipeline_run, foreign_key: true
      t.integer    :step_number
      t.integer    :job_type
      t.string     :job_status
      t.integer    :db_load_status, null:false, default: 0
      t.text       :job_command
      t.text       :command_stdout
      t.text       :command_stderr
      t.string     :command_status
      t.text       :job_description
      t.string     :job_log_id
      t.float      :job_progress_pct
      t.index      [:pipeline_run_id, :step_number]
      t.timestamps
    end
  end
end
