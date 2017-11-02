class CreateGsnaplRuns < ActiveRecord::Migration[5.1]
  def change
    create_table :gsnapl_runs do |t|
      t.references :gsnapl_machine, foreign_key: true
      t.string :aws_batch_job_id

      t.timestamps
    end
  end
end
