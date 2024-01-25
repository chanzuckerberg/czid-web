# frozen_string_literal: true

class SetDefaultAlignmentConfig < ActiveRecord::Migration[6.1]
  ALIGNMENT_CONFIG_2021 = "2021-01-22"

  def up
    if !AppConfigHelper.get_app_config(AppConfig::DEFAULT_ALIGNMENT_CONFIG_NAME)
      AppConfigHelper.set_app_config(AppConfig::DEFAULT_ALIGNMENT_CONFIG_NAME, ALIGNMENT_CONFIG_2021)
    end
  end

  def down
    raise ActiveRecord::IrreversibleMigration
  end
end
