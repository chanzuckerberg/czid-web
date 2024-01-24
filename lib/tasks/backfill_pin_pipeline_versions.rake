# For each project in the database, pins the major version of all pipelines.
# Existing pinned version prefixes will not be overwritten.
desc "pin major pipeline version for all existing projects"
task backfill_pin_pipeline_versions: :environment do
  batch_size = 1000

  latest_major_versions = WorkflowRun.latest_major_workflow_versions.except(WorkflowRun::WORKFLOW[:main], WorkflowRun::WORKFLOW[:benchmark])

  puts("The latest major versions to pin are: #{latest_major_versions}")

  current_batch = 0
  Project.in_batches(of: batch_size) do |projects|
    projects.each(&:pin_to_major_versions)
    current_batch += 1
    puts "Created ProjectWorkflowVersions for batch #{current_batch}"
  end
end
