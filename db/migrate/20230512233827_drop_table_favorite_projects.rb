class DropTableFavoriteProjects < ActiveRecord::Migration[6.1]
  def up
    drop_table :favorite_projects
    safety_assured { change_table :users, bulk: true do |t|
      t.remove :favorite_projects_count
      t.remove :favorites_count
    end }
  end

  def down
    raise ActiveRecord::IrreversibleMigration
  end
end
