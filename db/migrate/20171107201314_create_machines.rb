class CreateMachines < ActiveRecord::Migration[5.1]
  def change
    create_table :machines do |t|
      t.string :ip
      t.string :instance_id
      t.string :service

      t.timestamps
    end
    add_index :machines, :ip
  end
end
