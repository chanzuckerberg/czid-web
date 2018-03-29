class AddIndexToErccCounts < ActiveRecord::Migration[5.1]
  def change
    remove_index :ercc_counts, :name
    remove_index :ercc_counts, :pipeline_run_id
    add_index :ercc_counts, [:pipeline_run_id, :name], unique: true
  end
end
