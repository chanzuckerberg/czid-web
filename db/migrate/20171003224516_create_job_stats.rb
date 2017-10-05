class CreateJobStats < ActiveRecord::Migration[5.1]
  def change
    create_table :job_stats do |t|
      t.string :task
      t.integer :reads_before
      t.integer :reads_after
      t.references :pipeline_output, foreign_key: true

      t.timestamps
    end
  end
end
