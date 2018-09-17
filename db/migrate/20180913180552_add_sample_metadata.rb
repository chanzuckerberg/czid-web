class AddSampleMetadata < ActiveRecord::Migration[5.1]
  def change
    # Each entry in this table is a piece of metadata on a Sample.
    create_table :metadata do |t|
      t.string :key, null: false
      # 0 for string, 1 for number, 2 for lists (as string)
      t.integer :data_type, null: false, limit: 1
      t.string :text_raw_value
      t.string :text_validated_value
      t.float :number_raw_value
      t.float :number_validated_value
      t.integer :sample_id
      t.timestamps

      t.index :sample_id
    end
  end
end
