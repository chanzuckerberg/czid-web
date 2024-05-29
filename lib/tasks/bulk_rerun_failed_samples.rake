# This script is to be used for on-call duties when
# samples from a large upload fail due to rate limiting
# issues, usually from S3.
# If rerunning a large number of failed samples (>~50),
# recommend sleeping between reruns to avoid rate limiting.
# This script is idempotent.
task bulk_rerun_failed_samples: :environment do
  DEFAULT_BATCH_SIZE = 50
  DEFAULT_SLEEP_TIME = 30.minutes

  project_id = prompt("Enter project ID: ").to_i

  project = Project.find(project_id)
  creator = User.find(project.creator_id)
  puts("Found project #{project.name} with owner #{creator.name + ' ' + creator.email}")

  user_input_sleep = prompt("Enter sleep time between rerun batches (in minutes)(default #{DEFAULT_SLEEP_TIME.inspect}): ")
  sleep_time = user_input_sleep.present? ? user_input_sleep.to_i.minutes : DEFAULT_SLEEP_TIME
  user_input_batch_size = prompt("Enter batch size (default #{DEFAULT_BATCH_SIZE}) for reruns (batch size arbitrary if no sleep time between batches): ")
  batch_size = user_input_batch_size.present? ? user_input_batch_size.to_i : DEFAULT_BATCH_SIZE

  WorkflowRun::MNGS_WORKFLOWS.each do |workflow|
    failed_pipeline_runs = PipelineRun.joins(:sample).where(samples: { project_id: project_id }).where(deprecated: false, technology: WorkflowRun::MNGS_WORKFLOW_TO_TECHNOLOGY[workflow]).filter(&:failed?)

    puts("Found #{failed_pipeline_runs.count} failed pipeline runs for project #{project.name} and workflow #{workflow}")

    next if failed_pipeline_runs.empty?

    # mNGS reruns are based off sample, not pipeline run
    samples = Sample.where(id: failed_pipeline_runs.pluck(:sample_id))

    prompt_and_batch_rerun(samples, workflow, batch_size, sleep_time)
  end

  [WorkflowRun::WORKFLOW[:amr], WorkflowRun::WORKFLOW[:consensus_genome]].each do |workflow|
    failed_wrs = WorkflowRun.joins(:sample).where(samples: { project_id: project_id }).where(deprecated: false, status: WorkflowRun::STATUS[:failed], workflow: workflow)

    puts("Found #{failed_wrs.count} failed workflow runs for project #{project.name} and workflow #{workflow}")

    next if failed_wrs.empty?

    prompt_and_batch_rerun(failed_wrs, workflow, batch_size, sleep_time)
  end

  puts("Finished rerunning failed samples for project #{project.name}. Check Resque for status of jobs.")
end

def prompt_and_batch_rerun(objects, workflow, batch_size, sleep_time)
  should_rerun = prompt("Would you like to rerun all failed runs for workflow #{workflow}? (y/n): ") == "y"

  if should_rerun
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
    puts("Reran failed runs for workflow #{workflow}")
  else
    puts("Skipping rerunning for workflow #{workflow}")
  end
end

def prompt(*args)
  print(*args)
  STDIN.gets.chomp
end
