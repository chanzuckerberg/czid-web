class CreateSamples < ActiveRecord::Migration[5.1]
  def change
    create_table :samples do |t|
      t.string :name

      t.timestamps
    end
    add_index :samples, :name, unique: true
  end
end
