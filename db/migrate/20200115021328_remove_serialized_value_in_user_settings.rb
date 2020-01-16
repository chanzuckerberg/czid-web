class RemoveSerializedValueInUserSettings < ActiveRecord::Migration[5.1]
  def change
    change_table :user_settings, bulk: true do |t|
      t.remove :value
      t.string :serialized_value, comment: "The serialized value of the user setting. The schema of this value (e.g. boolean, number) is determined by the hard-coded data type associated with the key."
    end
  end
end
