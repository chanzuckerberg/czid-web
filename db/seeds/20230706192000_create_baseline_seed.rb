require_all 'lib/seed_resources'

class CreateBaselineSeed < SeedMigration::Migration
  def up
    SeedResource::AppConfigs.seed
    seed_alignment_config
    users = seed_users
    projects = seed_projects(users)
    samples = seed_samples(users, projects)
    seed_pathogen_list
  end

  def down
    User.destroy_by(email: "czid-e2e@chanzuckerberg.com")
    Sample.destroy_by(name: "E2E Test Sample")
    Project.destroy_by(name: "E2E Test Project")
  end

  private

  def seed_users
    user_attributes = [
      { email: "czid-e2e@chanzuckerberg.com", name: "CZ ID Test Account", role: 1, profile_form_version: 1 },
    ]

    users = user_attributes.map { |attributes| FactoryBot.find_or_create(:user, attributes)}
    users
  end

  def seed_projects(users)
    project_attributes = [
      { name: "E2E Test Project", public_access: 1,  description: "E2E Test Project", users: users, creator_id: users.first.id },
    ]

    projects = project_attributes.map { |attributes| FactoryBot.find_or_create(:project, attributes) }
    projects
  end

  def seed_samples(users, projects)
    sample_attributes = [
      {
        name: "E2E Test Sample 1",
        project: projects.first,
        user: users.first,
        workflow_runs_data: [
          {
            workflow: WorkflowRun::WORKFLOW[:consensus_genome],
            deprecated: false,
            status: WorkflowRun::STATUS[:succeeded],
          },
          {
            workflow: WorkflowRun::WORKFLOW[:amr],
            deprecated: false,
            status: WorkflowRun::STATUS[:succeeded],
          }
        ],
        pipeline_runs_data: {
          technology: PipelineRun::TECHNOLOGY_INPUT[:illumina],
        },
      },
      {
        name: "E2E Test Sample 2",
        project: projects.first,
        user: users.first,
        pipeline_runs_data: {
          technology: PipelineRun::TECHNOLOGY_INPUT[:illumina],
        },
      },
    ]

    samples = SeedResource::Samples.seed(sample_attributes)
    pipeline_run_ids = samples.map { |sample| sample.pipeline_runs.first.id }
    seed_background(pipeline_run_ids)
    samples
  end

  def seed_alignment_config
    FactoryBot.find_or_create(:alignment_config, name: "2021-01-22", index_dir_suffix: "2021-01-22", s3_nt_db_path: "s3://idseq-public-references/ncbi-sources/2021-01-22/nt", s3_nt_loc_db_path: "s3://idseq-public-references/alignment_data/2021-01-22/nt_loc.db", s3_nr_db_path: "s3://idseq-public-references/ncbi-sources/2021-01-22/nr", s3_nr_loc_db_path: "s3://idseq-public-references/alignment_data/2021-01-22/nr_loc.db", s3_lineage_path: "s3://idseq-public-references/taxonomy/2021-01-22/taxid-lineages.db", s3_accession2taxid_path: "s3://idseq-public-references/alignment_data/2021-01-22-full-nr/accession2taxid.db", s3_deuterostome_db_path: "s3://idseq-public-references/taxonomy/2021-01-22/deuterostome_taxids.txt", created_at: "2021-05-27 02:28:39", updated_at: "2021-12-08 01:32:38", s3_nt_info_db_path: "s3://idseq-public-references/alignment_data/2021-01-22/nt_info.db", s3_taxon_blacklist_path: "s3://idseq-public-references/taxonomy/2021-01-22/taxon_blacklist.txt", lineage_version_old: 8, lineage_version: "2021-01-22")
  end

  def seed_pathogen_list
    global_list = FactoryBot.find_or_create(:pathogen_list, creator_id: nil, is_global: true)
    citation = FactoryBot.find_or_create(:citation, key: "seeded-citation-7-18-23", footnote: "seeded-citation-7-18-23")
    FactoryBot.find_or_create(:pathogen_list_version, version: "1.0.0", pathogen_list_id: global_list.id)

    # Tag Betacoronavirus 1 (tax_id is 694002) as a pathogen
    FactoryBot.find_or_create(:pathogen, tax_id: 694002)
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
