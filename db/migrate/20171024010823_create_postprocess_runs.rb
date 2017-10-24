class CreatePostprocessRuns < ActiveRecord::Migration[5.1]
  def change
    create_table :postprocess_runs do |t|
      t.string :job_id
      t.text :command
      t.string :command_stdout
      t.text :command_error
      t.string :command_status
      t.string :job_status
      t.text :job_description
      t.string :job_log_id
      t.references :pipeline_output, foreign_key: true

      t.timestamps
    end
    add_index :postprocess_runs, :job_status
  end
end
