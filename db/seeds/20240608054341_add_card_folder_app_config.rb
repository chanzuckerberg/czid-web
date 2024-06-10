class AddCardFolderAppConfig < SeedMigration::Migration
  def up
    AppConfigHelper.set_app_config(AppConfig::CARD_FOLDER, "card-3.2.6-wildcard-4.0.0")
  end

  def down
    AppConfigHelper.remove_app_config(AppConfig::CARD_FOLDER)
  end
end
