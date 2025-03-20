class CreateUserProfile < ActiveRecord::Migration[7.0]
  def change
    create_table :user_profiles do |t|
      t.bigint :user_id, null: false
      t.string :first_name
      t.string :last_name
      t.integer :profile_form_version
      t.string :ror_institution
      t.string :ror_id
      t.string :country
      t.string :world_bank_income
      t.string :expertise_level
      t.string :czid_usecase
      t.string :referral_source
      t.boolean :newsletter_consent
      t.datetime "created_at", precision: 6, null: false
      t.datetime "updated_at", precision: 6, null: false
    end
  end
end
