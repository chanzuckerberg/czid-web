class AddLocationLevelIds < ActiveRecord::Migration[5.1]
  def up
    add_column :locations, :country_id, :integer, comment: "ID of the country entry in our database"
    add_column :locations, :state_id, :integer, comment: "ID of the state entry in our database"
    add_column :locations, :subdivision_id, :integer, comment: "ID of the subdivision entry in our database"
    add_column :locations, :city_id, :integer, comment: "ID of the city entry in our database"
  end

  def down
    remove_column :locations, :country_id
    remove_column :locations, :state_id
    remove_column :locations, :subdivision_id
    remove_column :locations, :city_id
  end
end
