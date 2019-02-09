class RemoveIndexFromMetadataFieldName < ActiveRecord::Migration[5.1]
  def change
    remove_index :metadata_fields, name: "index_metadata_fields_on_name"
  end
end
