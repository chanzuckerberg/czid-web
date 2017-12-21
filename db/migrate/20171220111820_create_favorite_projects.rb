class CreateFavoriteProjects < ActiveRecord::Migration[5.1]
  def change
    create_table :favorite_projects do |t|
      t.integer :project_id
      t.integer :user_id

      t.timestamps
    end
  end
end
