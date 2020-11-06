class AddUserCreatedBy < ActiveRecord::Migration[5.1]
  def up
    # Clubhouse ticket: https://app.clubhouse.io/idseq/story/13846
    add_column :users, :created_by_user_id, :bigint, comment: "The user_id that created/invited this user."
  end

  def down
    remove_column :users, :created_by_user_id
  end
end
