class AddLocationTable < ActiveRecord::Migration[5.1]
  def change
    create_table :locations
  end
end
