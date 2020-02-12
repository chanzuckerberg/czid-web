class CreateInsertSizeMetricSets < ActiveRecord::Migration[5.1]
  def change
    create_table :insert_size_metric_sets do |t|
      t.bigint :pipeline_run_id
      t.integer :median_insert_size
      t.integer :mode_insert_size
      t.integer :median_absolute_deviation
      t.integer :min_insert_size
      t.integer :max_insert_size
      t.integer :mean_insert_size
      t.integer :standard_deviation
      t.integer :read_pairs

      t.index :pipeline_run_id

      t.timestamps
    end
  end
end
