# For each project in the database, pins the major version of all pipelines that are included in the project.
# If a sample does not have any runs of a given workflow, the major version will not be pinned.
desc "pin major pipeline version for all existing projects"
task backfill_pin_pipeline_versions: :environment do
  short_read_mngs_workflow = WorkflowRun::WORKFLOW[:short_read_mngs]
  long_read_mngs_workflow = WorkflowRun::WORKFLOW[:long_read_mngs]
  consensus_genome_workflow = WorkflowRun::WORKFLOW[:consensus_genome]
  amr_workflow = WorkflowRun::WORKFLOW[:amr]

  batch_size = 1000

  latest_major_versions = WorkflowRun.latest_major_workflow_versions.except(WorkflowRun::WORKFLOW[:main], WorkflowRun::WORKFLOW[:benchmark])

  puts("The latest major versions to pin are: #{latest_major_versions}")

  # get the project ids that contain runs of each workflow
  project_ids_for_workflows = {
    short_read_mngs_workflow => PipelineRun.joins(:sample).where(technology: PipelineRun::TECHNOLOGY_INPUT[:illumina]).distinct.pluck("samples.project_id"),
    long_read_mngs_workflow => PipelineRun.joins(:sample).where(technology: PipelineRun::TECHNOLOGY_INPUT[:nanopore]).distinct.pluck("samples.project_id"),
    consensus_genome_workflow => WorkflowRun.joins(:sample).where(workflow: consensus_genome_workflow).distinct.pluck("samples.project_id"),
    amr_workflow => WorkflowRun.joins(:sample).where(workflow: amr_workflow).distinct.pluck("samples.project_id"),
  }

  latest_major_versions.each do |workflow, major_version|
    # get all projects with runs of this type that are not already pinned
    project_ids_with_workflow_runs = project_ids_for_workflows[workflow]
    project_ids_already_pinned = ProjectWorkflowVersion.project_ids_pinned_to_workflow(workflow)
    project_ids_to_pin = project_ids_with_workflow_runs - project_ids_already_pinned

    puts "Pinning #{project_ids_to_pin.length} projects to major version #{major_version} for workflow #{workflow} in batches of #{batch_size}"
    current_batch = 0
    # Querying for projects and then plucking id is unnecessary but validates that all project ids belong
    # to existing projects
    Project.where(id: project_ids_to_pin).in_batches(of: batch_size) do |projects|
      projects.each do |project|
        ProjectWorkflowVersion.create!([
                                         { project_id: project.id, workflow: workflow, version_prefix: major_version },
                                       ])
      end
      current_batch += 1
      puts "Created ProjectWorkflowVersions for batch #{current_batch} for workflow #{workflow}"
    end

    puts "Pinned #{project_ids_to_pin.length} projects for workflow #{workflow} to major version #{major_version}"
  end
end
