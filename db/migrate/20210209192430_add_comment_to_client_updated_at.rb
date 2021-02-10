class AddCommentToClientUpdatedAt < ActiveRecord::Migration[5.2]
  def up
    change_column :samples, :client_updated_at, :datetime, comment: "Deprecated as of 2021-02-09."
  end

  def down
    change_column :samples, :client_updated_at, :datetime, comment: nil
  end
end
