class MetadataMoveDataType < ActiveRecord::Migration[5.1]
  def up
    # Make data_type optional but don't blow it all away yet
    change_column :metadata, :data_type, :integer, null: true
  end

  def down
    change_column :metadata, :data_type, :integer, null: false
  end
end
