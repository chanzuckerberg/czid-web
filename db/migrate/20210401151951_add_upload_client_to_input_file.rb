class AddUploadClientToInputFile < ActiveRecord::Migration[5.2]
  def change
    add_column :input_files, :upload_client, :string
  end
end
