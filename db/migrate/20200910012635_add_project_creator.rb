class AddProjectCreator < ActiveRecord::Migration[5.2]
  def change
    add_column :projects, :creator_id, :bigint, comment: "The user_id that created the project."
  end
end
