class CreateContigs < ActiveRecord::Migration[5.1]
  def change
    add_column :pipeline_runs, :assembled, :integer, limit: 2
    create_table :contigs do |t|
      t.bigint "pipeline_run_id"
      t.string "name"
      t.text "sequence"
      t.integer "read_count"
      t.timestamps
      t.index ["pipeline_run_id", "name"], unique: true
      t.index ["pipeline_run_id", "read_count"]
    end
  end
end
