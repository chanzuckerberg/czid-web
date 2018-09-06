class AddAllowedFeaturesToUser < ActiveRecord::Migration[5.1]
  def change
    add_column :users, :allowed_features, :text
  end
end
