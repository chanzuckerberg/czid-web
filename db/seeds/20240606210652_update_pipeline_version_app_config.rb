class UpdatePipelineVersionAppConfig < SeedMigration::Migration
  def up
    cg_app_config = AppConfig.find_by(key: "consensus-genome-version").update(value: "3.5.1")
    FactoryBot.find_or_create(:workflow_version, version: "3.5.1", workflow: "consensus_genome")

    AppConfig.find_by(key: "long-read-mngs-version").update(value: "0.7.8")
    FactoryBot.find_or_create(:workflow_version, version: "0.7.8", workflow: "long_read_mngs")
  end

  def down
    AppConfig.find_by(key: "consensus-genome-version").update(value: "3.4.18")
    WorkflowVersion.find_by(version: "3.5.1", workflow: "consensus_genome").destroy

    AppConfig.find_by(key: "long-read-mngs-version").update(value: "0.7.3")
    WorkflowVersion.find_by(version: "0.7.8", workflow: "long_read_mngs").destroy
  end
end
