class AddDescriptionToBackground < ActiveRecord::Migration[5.1]
  def change
    add_column :backgrounds, :description, :text
    add_column :backgrounds, :public_access, :tinyint
  end
end
