class AddIndexToErccCounts < ActiveRecord::Migration[5.1]
  def change
    remove_index :ercc_counts, :name
    add_index :ercc_counts, :name, unique: true
  end
end
