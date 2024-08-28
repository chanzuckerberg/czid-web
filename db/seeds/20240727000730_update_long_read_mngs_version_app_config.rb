class UpdateLongReadMngsVersionAppConfig < SeedMigration::Migration
  def up
    AppConfigHelper.set_app_config("long-read-mngs-version", "0.7.11")
  end

  def down
    AppConfigHelper.set_app_config("long-read-mngs-version", "0.7.8")
  end
end
