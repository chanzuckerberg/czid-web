# Run as `rake backfill_pin_index_version_to_projects[version_to_pin]`
# If version_to_pin is omitted it will default to the current default alignment config name.
desc "Backfill ProjectWorkflowVersion for NCBI index version"
task :backfill_pin_index_version_to_projects, [:version_to_pin] => :environment do |_, args|
  version_to_pin = args[:version_to_pin]
  if version_to_pin.nil?
    version_to_pin = "2021-01-22"
  end

  batch_size = 100

  workflow = AlignmentConfig::NCBI_INDEX
  unless WorkflowVersion.find_by(workflow: workflow, version: version_to_pin)
    raise ErrorHelper::VersionControlErrors.workflow_version_not_found(workflow, version_to_pin)
  end

  # get all project ids that have an mNGS pipeline run by inner joining pipeline runs to samples
  project_ids = PipelineRun.joins(:sample).distinct.pluck("samples.project_id")

  project_ids_already_pinned = ProjectWorkflowVersion.where(project_id: project_ids, workflow: workflow).distinct.pluck(:project_id)
  project_ids_to_pin = project_ids - project_ids_already_pinned

  puts("Pinning index version to version #{version_to_pin} for #{project_ids_to_pin.count} projects in batches of #{batch_size}.")
  current_batch = 0
  Project.where(id: project_ids_to_pin).in_batches(of: batch_size) do |projects|
    projects.each do |project|
      ProjectWorkflowVersion.create!(project_id: project.id, workflow: workflow, version_prefix: version_to_pin)
    end
    current_batch += 1
    puts("Pinned index version for projects in batch #{current_batch}")
  end

  puts("Successfully pinned index version to version #{version_to_pin} for #{project_ids_to_pin.count} projects.")
end
