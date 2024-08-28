class UpdateMngsVersionAppConfig < SeedMigration::Migration
  def up
    AppConfigHelper.set_app_config("short-read-mngs-version", "8.3.11")
  end

  def down
    AppConfigHelper.set_app_config("short-read-mngs-version", "8.3.3")
  end
end
