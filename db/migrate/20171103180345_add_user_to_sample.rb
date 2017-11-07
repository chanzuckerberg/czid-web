class AddUserToSample < ActiveRecord::Migration[5.1]
  def change
    add_reference :samples, :user, foreign_key: true
  end
end
