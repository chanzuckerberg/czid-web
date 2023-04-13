# frozen_string_literal: true

class BackfillProfileFormVersionOnUsers < ActiveRecord::Migration[6.1]
  def up
    User.unscoped.in_batches do |user|
      user.update_all profile_form_version: 1
    end
  end

  def down
    raise ActiveRecord::IrreversibleMigration
  end
end
