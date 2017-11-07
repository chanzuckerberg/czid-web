class CreateMachineRuns < ActiveRecord::Migration[5.1]
  def change
    create_table :machine_runs do |t|
      t.references :machine, foreign_key: true
      t.string :aws_batch_job_id

      t.timestamps
    end
  end
end
