class AddArchetypesAndGroupsToUsers < ActiveRecord::Migration[5.2]
  def change
    change_table :users, bulk: true do |t|
      t.text :archetypes
      t.string :group
    end
  end
end
