class AddCreatedByToBackground < ActiveRecord::Migration[5.1]
  def change
    add_column :backgrounds, :user_id, :bigint
  end
end
