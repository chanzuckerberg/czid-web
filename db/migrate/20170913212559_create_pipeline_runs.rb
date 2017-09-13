class CreatePipelineRuns < ActiveRecord::Migration[5.1]
  def change
    create_table :pipeline_runs do |t|
      t.string :job_id
      t.text   :command
      t.string :command_stdout
      t.text :command_error
      t.string :command_status
      t.references :sample, foreign_key: true
      t.timestamps
    end
  end
end
