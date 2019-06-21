class AddLocationLevelIds < ActiveRecord::Migration[5.1]
  def up
    add_column :locations, :country_id, :integer
    add_column :locations, :state_id, :integer
    add_column :locations, :subdivision_id, :integer
    add_column :locations, :city_id, :integer
  end

  def down
    remove_column :locations, :country_id
    remove_column :locations, :state_id
    remove_column :locations, :subdivision_id
    remove_column :locations, :city_id
  end
end
