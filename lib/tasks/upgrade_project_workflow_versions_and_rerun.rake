desc "Upgrade a project with the given project_id to the latest workflow versions and rerun samples."
task :upgrade_project_workflow_versions, [:project_id] => :environment do |_task, args|
  DEFAULT_BATCH_SIZE = 50
  DEFAULT_SLEEP_TIME = 30.minutes
  project_id = args[:project_id]

  workflows = [:amr, :consensus_genome, :long_read_mngs, :short_read_mngs]

  latest_versions = workflows.to_h { |sym| [WorkflowRun::WORKFLOW[sym], AppConfigHelper.get_workflow_version(WorkflowRun::WORKFLOW[sym])] }

  latest_versions.each_pair do |workflow, latest_version|
    major_version = Gem::Version.new(latest_version).segments[0].to_s
    project_workflow_version = ProjectWorkflowVersion.find_by(project_id: project_id, workflow: workflow) || ProjectWorkflowVersion.new(project: project_id, workflow: workflow)
    project_workflow_version.version_prefix = major_version
    project_workflow_version.save!
  end

  ncbi_project_workflow_version = ProjectWorkflowVersion.find_by(project_id: project_id, workflow: AlignmentConfig::NCBI_INDEX) || ProjectWorkflowVersion.new(project: project_id, workflow: AlignmentConfig::NCBI_INDEX)
  ncbi_project_workflow_version.version_prefix = AppConfigHelper.get_app_config(AppConfig::DEFAULT_ALIGNMENT_CONFIG_NAME)
  ncbi_project_workflow_version.save!

  WorkflowRun::MNGS_WORKFLOWS.each do |workflow|
    latest_version = latest_versions[workflow]
    pipeline_runs = PipelineRun.joins(:sample).where(samples: { project_id: project_id }).where(deprecated: false, technology: WorkflowRun::MNGS_WORKFLOW_TO_TECHNOLOGY[workflow]).where.not(pipeline_version: latest_version)

    puts("Found #{pipeline_runs.count} failed pipeline runs for project #{project.name} and workflow #{workflow}")

    next if pipeline_runs.empty?

    # mNGS reruns are based off sample, not pipeline run
    samples = Sample.where(id: pipeline_runs.pluck(:sample_id))

    batch_rerun(samples, workflow, DEFAULT_BATCH_SIZE, DEFAULT_SLEEP_TIME)
  end

  [WorkflowRun::WORKFLOW[:amr], WorkflowRun::WORKFLOW[:consensus_genome]].each do |workflow|
    latest_version = latest_versions[workflow]
    workflow_runs = WorkflowRun.joins(:sample).where(samples: { project_id: project_id }).where(deprecated: false, workflow: workflow).where.not(wdl_version: latest_version)

    puts("Found #{workflow_runs.count} workflow runs for project #{project.name} and workflow #{workflow}")

    next if workflow_runs.empty?

    batch_rerun(workflow_runs, workflow, DEFAULT_BATCH_SIZE, DEFAULT_SLEEP_TIME)
  end
end

def batch_rerun(objects, workflow, batch_size, sleep_time)
  batch_index = 0
  objects.in_batches(of: batch_size) do |batch|
    delay = sleep_time * batch_index
    puts("Enqueueing rerun for batch #{batch_index} at #{delay.inspect} from now")
    Resque.enqueue_at(
      delay.from_now,
      RerunWorkflowRuns,
      batch.pluck(:id),
      workflow
    )
    batch_index += 1
  end
end
