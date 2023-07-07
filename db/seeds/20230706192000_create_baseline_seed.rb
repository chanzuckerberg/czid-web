require_all 'lib/seed_resources'

class CreateBaselineSeed < SeedMigration::Migration
  def up
    SeedResource::AppConfigs.seed
    seed_alignment_config
    users = seed_users
    projects = seed_projects(users)
    samples = seed_samples(users, projects)
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

    user_attributes.map { |attributes| find_or_create(:user, attributes)}
  end

  def seed_projects(users)
    project_attributes = [
      { name: "E2E Test Project", public_access: 1,  description: "E2E Test Project", users: users, creator_id: users.first.id },
    ]

    project_attributes.map { |attributes| find_or_create(:project, attributes) }
  end

  def seed_samples(users, projects)
    sample_attributes = [
      {
        name: "E2E Test Sample",
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
    ]
    samples = SeedResource::Samples.seed(sample_attributes)
  end

  def seed_alignment_config
    find_or_create(:alignment_config, name: "2021-01-22", index_dir_suffix: "2021-01-22", s3_nt_db_path: "s3://idseq-public-references/ncbi-sources/2021-01-22/nt", s3_nt_loc_db_path: "s3://idseq-public-references/alignment_data/2021-01-22/nt_loc.db", s3_nr_db_path: "s3://idseq-public-references/ncbi-sources/2021-01-22/nr", s3_nr_loc_db_path: "s3://idseq-public-references/alignment_data/2021-01-22/nr_loc.db", s3_lineage_path: "s3://idseq-public-references/taxonomy/2021-01-22/taxid-lineages.db", s3_accession2taxid_path: "s3://idseq-public-references/alignment_data/2021-01-22-full-nr/accession2taxid.db", s3_deuterostome_db_path: "s3://idseq-public-references/taxonomy/2021-01-22/deuterostome_taxids.txt", created_at: "2021-05-27 02:28:39", updated_at: "2021-12-08 01:32:38", s3_nt_info_db_path: "s3://idseq-public-references/alignment_data/2021-01-22/nt_info.db", s3_taxon_blacklist_path: "s3://idseq-public-references/taxonomy/2021-01-22/taxon_blacklist.txt", lineage_version_old: 8, lineage_version: "2021-01-22")
  end
end
