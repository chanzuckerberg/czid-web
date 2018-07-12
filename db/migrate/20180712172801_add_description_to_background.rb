class AddDescriptionToBackground < ActiveRecord::Migration[5.1]
  def change
    add_column :backgrounds, :description, :text
  end
end
