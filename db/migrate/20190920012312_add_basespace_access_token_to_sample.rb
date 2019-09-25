class AddBasespaceAccessTokenToSample < ActiveRecord::Migration[5.1]
  def change
    add_column :samples, :basespace_access_token, :string
  end
end
