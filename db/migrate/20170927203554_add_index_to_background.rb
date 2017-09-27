class AddIndexToBackground < ActiveRecord::Migration[5.1]
  def change
    add_index :backgrounds, :name, unique: true
  end
end
