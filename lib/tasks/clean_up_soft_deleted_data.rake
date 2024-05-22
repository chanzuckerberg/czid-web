# This rake task hard deletes soft deleted data that is older than a given delay
# in case the hard deletion job in the normal delete flow ever fails.
# This should ideally never have to be run.
task clean_up_soft_deleted_data: :environment do
  DELAY = 3.hours

  def prompt(*args)
    print(*args)
    STDIN.gets.chomp
  end

  batch_size = prompt("Enter batch size for hard delete jobs (default 100): ").to_i || 100

  # get user ids for soft deleted pipeline runs
  user_ids = PipelineRun.joins(:sample).where("pipeline_runs.deleted_at < ?", Time.now.utc - DELAY).pluck("samples.user_id").uniq.to_set
  # get user ids for soft deleted workflow runs
  user_ids = user_ids.merge(WorkflowRun.joins(:sample).where("workflow_runs.deleted_at < ?", Time.now.utc - DELAY).pluck("samples.user_id").uniq.to_set)

  # go user by user, workflow by workflow and enqueue hard delete jobs
  user_ids.each do |user_id|
    user = User.find(user_id)
    current_power = Power.new(user)
    # store sample ids without pipeline or workflow runs
    deleted_sample_ids = current_power.destroyable_samples.where("samples.deleted_at < ?", Time.now.utc - DELAY).pluck(:id)

    # check mNGS runs
    WorkflowRun::MNGS_WORKFLOWS.each do |workflow|
      technology = WorkflowRun::MNGS_WORKFLOW_TO_TECHNOLOGY[workflow]
      pipeline_runs = current_power.deletable_pipeline_runs.where("pipeline_runs.deleted_at < ?", Time.now.utc - DELAY).where("pipeline_runs.technology = ?", technology)

      if pipeline_runs.present?
        deleted_sample_ids -= pipeline_runs.pluck(:sample_id)
        prompt_user_and_delete_runs(pipeline_runs, user, workflow, batch_size)
      end
    end

    # Check non-mNGS runs
    [WorkflowRun::WORKFLOW[:amr], WorkflowRun::WORKFLOW[:consensus_genome]].each do |workflow|
      workflow_runs = current_power.deletable_workflow_runs.where("workflow_runs.deleted_at < ?", Time.now.utc - DELAY).where("workflow_runs.workflow = ?", workflow)
      if workflow_runs.present?
        deleted_sample_ids -= workflow_runs.pluck(:sample_id)
        prompt_user_and_delete_runs(workflow_runs, user, workflow, batch_size)
      end
    end

    # deal with samples that don't have pipeline or workflow runs
    if deleted_sample_ids.present?
      puts("Sample ids without pipeline or workflow runs: #{deleted_sample_ids}")
      should_delete_samples = prompt("Do you want to hard delete these samples? (y/n): ") == "y"

      if should_delete_samples
        puts("Enqueuing hard delete jobs for #{deleted_sample_ids.count} samples without pipeline or workflow runs")
        Resque.enqueue(HardDeleteObjects, [], deleted_sample_ids, WorkflowRun::WORKFLOW[:short_read_mngs], user_id)
      end
    end
  end
  puts("Finished enqueueing delete jobs for all users. Check Resque for status of jobs.")
end

def prompt_user_and_delete_runs(runs, user, workflow, batch_size)
  puts("User #{user.id}, email #{user.email} has #{runs.count} soft deleted workflow runs for workflow #{workflow}")
  puts("Run ids: #{runs.pluck(:id)}")
  should_delete_runs = prompt("Do you want to hard delete these runs? (y/n): ") == "y"

  if should_delete_runs
    puts("Enqueueing hard delete jobs for #{runs.count} runs in batches of #{batch_size} for workflow #{workflow} and user #{user.id}")
    batch_index = 0
    runs.in_batches(of: batch_size) do |batch|
      delay = batch_index * 5.minutes
      # .transpose turns array [["run1", "sample1"], ["run2", "sample2"]] into [["run1", "run2"], ["sample1", "sample2"]]
      ids = batch.pluck(:id, :sample_id).transpose
      Resque.enqueue_at(delay.from_now, HardDeleteObjects, ids[0], ids[1], workflow, user.id)
      puts("Enqueued hard delete job for batch #{batch_index} at #{delay.inspect} from now")
      batch_index += 1
    end
  end
end
