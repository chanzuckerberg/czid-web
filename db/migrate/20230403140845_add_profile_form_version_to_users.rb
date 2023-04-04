class AddProfileFormVersionToUsers < ActiveRecord::Migration[6.1]
  def change
    add_column :users, :profile_form_version, :integer, null: false, comment: "Version of completed user profile form, or 0 to denote missing profile form."
    change_column_default :users, :profile_form_version, 0
  end
end
