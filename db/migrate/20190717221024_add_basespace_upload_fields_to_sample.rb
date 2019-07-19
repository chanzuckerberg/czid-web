class AddBasespaceUploadFieldsToSample < ActiveRecord::Migration[5.1]
  def change
    add_column :samples, :uploaded_from_basespace, :integer, limit: 1, default: 0
    add_column :samples, :upload_error, :string
  end
end
