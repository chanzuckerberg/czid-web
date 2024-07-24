class AddMaxObjectBulkDownloadAppConfig < SeedMigration::Migration
  def up
    AppConfigHelper.set_app_config("max_objects_bulk_download", "500")
  end

  def down
    AppConfigHelper.remove_app_config("max_objects_bulk_download")
  end
end
