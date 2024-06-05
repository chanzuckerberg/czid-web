require_all 'lib/seed_resources'

class CreateBaselineSeed < SeedMigration::Migration
  def up
    SeedResource::AppConfigs.seed
    SeedResource::AlignmentConfigs.seed
    SeedResource::HostGenomes.seed
    SeedResource::WorkflowVersions.seed
    SeedResource::MetadataFields.seed
    SeedResource::SampleTypes.seed

    users = seed_users
    seed_pathogen_list
  end

  def down
    PathogenListVersion.all.each do |pathogen_list_version|
      pathogen_list_version.citations.clear
      pathogen_list_version.pathogens.clear
    end

    Pathogen.destroy_all
    Citation.destroy_all
    PathogenListVersion.destroy_all
    PathogenList.destroy_all

    User.destroy_by(email: "czid-e2e@chanzuckerberg.com")
    Sample.destroy_by(name: "E2E Test Sample")
    Project.destroy_by(name: "E2E Test Project")

    SampleType.destroy_all
    MetadataField.destroy_all
    WorkflowVersion.destroy_all
    # HostGenomes will not delete due to association has_many :samples, dependent: :restrict_with_exception
    AlignmentConfig.destroy_all
    AppConfig.destroy_all
  end

  private

  def seed_users
    user_attributes = [
      { email: "czid-e2e@chanzuckerberg.com", name: "CZ ID Test Account", role: 1, profile_form_version: 1 },
    ]

    users = user_attributes.map { |attributes| FactoryBot.find_or_create(:user, attributes)}
    users
  end

  def seed_pathogen_list
    global_list = FactoryBot.find_or_create(:pathogen_list, creator_id: nil, is_global: true)
    pathogen_list_version = FactoryBot.find_or_create(:pathogen_list_version, version: "1.0.0", pathogen_list_id: global_list.id)
    citation = FactoryBot.find_or_create(:citation, key: "seeded-citation-7-18-23", footnote: "seeded-citation-7-18-23")
    # Tag Betacoronavirus 1 (tax_id is 694002) as a pathogen
    pathogen = FactoryBot.find_or_create(:pathogen, tax_id: 694002)

    # PathogenListVersion HABTM associations
    pathogen_list_version.citations << citation
    pathogen_list_version.pathogens << pathogen
  end

  def seed_background(pipeline_run_ids, taxon_summaries_data = nil)
    # Background with taxon summaries for Klebsiella pneumoniae and Klebsiella
    FactoryBot.find_or_create(:background,
      name: "E2E Test Background",
      description: "E2E Test Background",
      pipeline_run_ids: pipeline_run_ids,
      public_access: 1,
      ready: 1,
      taxon_summaries_data: [{
        tax_id: 573,
        count_type: "NR",
        tax_level: 1,
        mean: 29.9171,
        stdev: 236.332,
      }, {
        tax_id: 573,
        count_type: "NT",
        tax_level: 1,
        mean: 9.35068,
        stdev: 26.4471,
      }, {
        tax_id: 570,
        count_type: "NR",
        tax_level: 2,
        mean: 35.0207,
        stdev: 238.639,
      }, {
        tax_id: 570,
        count_type: "NT",
        tax_level: 2,
        mean: 18.3311,
        stdev: 64.2056,
      },]
    )
  end
end
