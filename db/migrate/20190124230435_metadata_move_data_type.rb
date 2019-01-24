class MetadataMoveDataType < ActiveRecord::Migration[5.1]
  def up
    change_column :metadata, :data_type, :integer, null: true
  end

  def down
    change_column :metadata, :data_type, :integer, null: false
  end
end
