class RemoteDataTypeFromMetadata < ActiveRecord::Migration[5.1]
  def change
    remove_column :metadata, :data_type
  end
end
