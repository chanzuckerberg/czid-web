class CreatePersistedBackgrounds < ActiveRecord::Migration[6.1]
  def change
    create_table :persisted_backgrounds do |t|
      t.bigint :user_id, null: false, comment: "The id of the user that has the persisted_background"
      t.bigint :project_id, null: false, comment: "The id of the project that the persisted background is persisted for"
      t.bigint :background_id, comment: "The id of the background that is being persisted. Will be set to null if the user selects a background with an incompatible sample."
      t.timestamps

      t.index [:user_id, :project_id], name: "index_user_id_project_id", unique: true
    end
  end
end
