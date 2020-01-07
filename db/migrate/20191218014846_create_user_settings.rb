class CreateUserSettings < ActiveRecord::Migration[5.1]
  def change
    create_table :user_settings do |t| # A table of user settings. Each user + setting combination is a separate row.
      t.references :user, foreign_key: true
      t.string :key, comment: "The name of the user setting, e.g. receives_bulk_download_success_emails"
      t.string :value, comment: "The value of the user setting, e.g. true. The schema of this value (e.g. boolean, number) is determined by the hard-coded data type associated with the key."
      t.index ["user_id", "key"], unique: true
    end
  end
end
