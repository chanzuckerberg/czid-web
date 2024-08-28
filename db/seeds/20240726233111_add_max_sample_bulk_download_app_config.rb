class AddMaxSampleBulkDownloadAppConfig < SeedMigration::Migration
  def up
    AppConfigHelper.set_app_config("max_samples_bulk_download_original_files", "100")
  end

  def down
    AppConfigHelper.remove_app_config("max_samples_bulk_download_original_files")
  end
end
