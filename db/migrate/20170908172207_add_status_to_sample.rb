class AddStatusToSample < ActiveRecord::Migration[5.1]
  def change
    add_column :samples, :status, :string
  end
end
