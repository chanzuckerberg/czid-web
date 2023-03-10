# Automatically pins all exisitng projects to the latest workflow version for each workflow
# I decided to use a rake task instead of a migration because it's easier to control the execution of the task
# I'll delete this rake task once the values are successfully backfilled
# I'll also create a data migration to pin all exisitng projects to the latest workflow version after the modern host filtering project has been released

desc "Backfills ProjectWorkflowVersions for all existing projects"
task backfill_project_workflow_versions: :environment do
  # short-read-mngs and amr are the only workflows that are affected by modern host filtering so we need to pin the versions
  latest_major_short_read_mngs_version = AppConfigHelper.get_workflow_version(WorkflowRun::WORKFLOW[:short_read_mngs])[0] || "7"
  latest_major_amr_version = AppConfigHelper.get_workflow_version(WorkflowRun::WORKFLOW[:amr])[0] || "0"

  # Insert the latest workflow versions into the workflow_versions table
  workflows = WorkflowRun::WORKFLOW.except(:main).values

  new_workflow_versions = workflows.each_with_object([]) do |workflow, result|
    latest_version = AppConfigHelper.get_workflow_version(workflow)
    result << { workflow: workflow, version: latest_version, deprecated: false, runnable: true }
  end

  WorkflowVersion.create(new_workflow_versions)
  puts "Created WorkflowVersions for #{workflows}"

  # Pin all existing projects to the latest workflow version for only the short-read-mngs and amr workflows (the only workflows affected by modern host filtering)
  Project.in_batches do |projects|
    projects.each do |project|
      project_id = project.id
      ProjectWorkflowVersion.create!([
                                       { project_id: project_id, workflow: WorkflowRun::WORKFLOW[:short_read_mngs], version_prefix: latest_major_short_read_mngs_version },
                                       { project_id: project_id, workflow: WorkflowRun::WORKFLOW[:amr], version_prefix: latest_major_amr_version },
                                     ])
      puts "Created ProjectWorkflowVersions for project_id=#{project_id}"
    end
  end

  puts "Completed backfilling ProjectWorkflowVersions for all existing projects"
end
