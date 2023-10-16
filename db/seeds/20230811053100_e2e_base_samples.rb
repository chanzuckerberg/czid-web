require_all 'lib/seed_resources'

class E2eBaseSamples < SeedMigration::Migration
def up
    SeedResource::AppConfigs.seed
    users = User.find_by(email: "czid-e2e@chanzuckerberg.com")
    projects = Project.find_by(name: "E2E Test Project")
    samples = seed_samples(users, projects)
  end

  def down
    Sample.destroy_by(name: "Sample-25307")
    Sample.destroy_by(name: "Sample-24329")
    Sample.destroy_by(name: "Sample-25983")
    Sample.destroy_by(name: "Sample-25745")
    Sample.destroy_by(name: "Sample-26022")
    Sample.destroy_by(name: "Sample-25987")
    Sample.destroy_by(name: "Sample-25609")
    Sample.destroy_by(name: "Sample-25746")
    Sample.destroy_by(name: "Sample-25747")
  end

  private

  def seed_samples(users, projects)
    sample_attributes = [
      {
        name: "Sample-25307",
        project: projects,
        user: users,
        pipeline_runs_data: {
          technology: PipelineRun::TECHNOLOGY_INPUT[:illumina],
        },
      },
      {
        name: "Sample-24329",
        project: projects,
        user: users,
        pipeline_runs_data: {
          technology: PipelineRun::TECHNOLOGY_INPUT[:illumina],
        },
      },
      {
        name: "Sample-25983",
        project: projects,
        user: users,
        pipeline_runs_data: {
          technology: PipelineRun::TECHNOLOGY_INPUT[:illumina],
        },
      },
      {
        name: "Sample-25745",
        project: projects,
        user: users,
        pipeline_runs_data: {
          technology: PipelineRun::TECHNOLOGY_INPUT[:illumina],
        },
      },
      {
        name: "Sample-26022",
        project: projects,
        user: users,
        pipeline_runs_data: {
          technology: PipelineRun::TECHNOLOGY_INPUT[:illumina],
        },
      },
      {
        name: "Sample-25987",
        project: projects,
        user: users,
        pipeline_runs_data: {
          technology: PipelineRun::TECHNOLOGY_INPUT[:illumina],
        },
      },
      {
        name: "Sample-25609",
        project: projects,
        user: users,
        pipeline_runs_data: {
          technology: PipelineRun::TECHNOLOGY_INPUT[:illumina],
        },
      },
      {
        name: "Sample-25746",
        project: projects,
        user: users,
        pipeline_runs_data: {
          technology: PipelineRun::TECHNOLOGY_INPUT[:illumina],
        },
      },
      {
        name: "Sample-25747",
        project: projects,
        user: users,
        pipeline_runs_data: {
          technology: PipelineRun::TECHNOLOGY_INPUT[:illumina],
        },
      }
    ]
    samples = SeedResource::Samples.seed(sample_attributes)
  end
end
