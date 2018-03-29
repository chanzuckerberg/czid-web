class CreateErccCounts < ActiveRecord::Migration[5.1]
  def change
    create_table :ercc_counts do |t|
      t.bigint :pipeline_run_id
      t.string :name
      t.integer :count

      t.index :pipeline_run_id
      t.index :name

      t.timestamps
    end
  end
end
