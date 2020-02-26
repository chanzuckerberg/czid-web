class CreateInsertSizeMetricSets < ActiveRecord::Migration[5.1]
  def change
    create_table :insert_size_metric_sets do |t|
      t.bigint :pipeline_run_id, null: false
      t.integer :median, null: false
      t.integer :mode, null: false
      t.integer :median_absolute_deviation, null: false
      t.integer :min, null: false
      t.integer :max, null: false
      t.float :mean, null: false
      t.float :standard_deviation, null: false
      t.integer :read_pairs, null: false

      t.index :pipeline_run_id

      t.timestamps
    end
  end
end
