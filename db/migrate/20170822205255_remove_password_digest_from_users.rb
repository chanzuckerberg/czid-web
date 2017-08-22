class RemovePasswordDigestFromUsers < ActiveRecord::Migration[5.1]
  def change
    remove_column :users, :password_digest
  end
end
