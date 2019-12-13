class RemoveDeviseFieldsFromUser < ActiveRecord::Migration[5.1]
  def change
    reversible do |dir|
      dir.up do
        change_table(:users, bulk: true) do |t|
          t.remove :encrypted_password
          t.remove :remember_created_at
          t.remove :reset_password_token
          t.remove :reset_password_sent_at
        end
      end
      dir.down do
        require 'securerandom'
        change_table(:users, bulk: true) do |t|
          t.column :encrypted_password, :string, default: SecureRandom.hex
          t.column :remember_created_at, :datetime
          t.column :reset_password_token, :string, default: SecureRandom.hex
          t.column :reset_password_sent_at, :datetime
        end
      end
    end
  end
end
