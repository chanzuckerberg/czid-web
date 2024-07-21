class UpdateAmrVersion < SeedMigration::Migration
  def up
    AppConfigHelper.set_app_config("amr-version", "1.4.2")
  end

  def down
    AppConfigHelper.set_app_config("amr-version", "1.2.5")
  end
end
