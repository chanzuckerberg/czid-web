class UpdateMetadataJsonSizeOnDeletionLog < ActiveRecord::Migration[7.0]
  def change
    safety_assured { change_column :deletion_logs, :metadata_json, :string, limit: 1024 }
  end
end
