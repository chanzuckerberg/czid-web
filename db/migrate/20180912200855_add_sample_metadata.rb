class AddSampleMetadata < ActiveRecord::Migration[5.1]
  def change
    create_table :metadata do |t|
      t.string :key, null: false
      t.tinyint :data_type, null: false, default: 0 # 0 for string, 1 for number, 2 for lists (as string)
      t.string :text_raw_value
      t.string :text_validated_value
      t.float :number_raw_value
      t.float :number_validated_value
      t.bigint :sample_id
      t.timestamps

      t.index :sample_id
    end
  end
end
