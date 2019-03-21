class AddClientUpdatedAtToSamples < ActiveRecord::Migration[5.1]
  def change
    add_column :samples, :client_updated_at, :datetime
  end
end
