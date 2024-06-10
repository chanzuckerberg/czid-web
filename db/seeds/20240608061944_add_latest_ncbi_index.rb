class AddLatestNcbiIndex < SeedMigration::Migration
  def up
    FactoryBot.find_or_create(:workflow_version, workflow: AlignmentConfig::NCBI_INDEX, version: "2024-02-06")
  end

  def down
    WorkflowVersion.find_by(workflow: AlignmentConfig::NCBI_INDEX, version: "2024-02-06").destroy
  end
end
