# Deletes pipeline/workflow runs and samples in the background.
# If batching this job, make sure it is a low priority for the workers
# so that the other web app Resque jobs are not stalled when large deletions occur.
require 'resque-retry'

class HardDeleteObjects
  extend InstrumentedJob
  extend Resque::Plugins::Retry # automatically retries job once on failure (e.g. deploy cancels job)

  @queue = :hard_delete_objects
  @retry_delay = 120 # wait 120 seconds before re-enqueuing job in the event of a random failure

  DELETION_ATTEMPTS = 2 # retry deletion of object in case we hit a random deadlock
  RETRY_DELAY_SECONDS = 20

  # object ids are pipeline run ids or workflow run ids
  def self.perform(run_ids, sample_ids, workflow, user_id)
    Rails.logger.info("Starting to hard delete runs with ids #{run_ids} and workflow #{workflow}")
    hard_delete(run_ids, sample_ids, workflow, user_id)
  rescue StandardError => e
    LogUtil.log_error(
      "Bulk Deletion Failed: #{e}.",
      exception: e,
      run_ids: run_ids,
      sample_ids: sample_ids,
      workflow: workflow,
      user_id: user_id
    )
    raise e
  end

  def self.hard_delete(run_ids, sample_ids, workflow, user_id)
    user = User.find(user_id)
    current_power = Power.new(user)

    runs_to_delete = if [WorkflowRun::WORKFLOW[:short_read_mngs], WorkflowRun::WORKFLOW[:long_read_mngs]].include?(workflow)
                       current_power.deletable_pipeline_runs.where(id: run_ids)
                     else
                       current_power.deletable_workflow_runs.where(id: run_ids)
                     end

    # note: we have a scheduled lambda that cleans up taxa from ES for
    # pipeline runs no longer in the database
    hard_delete_runs(runs_to_delete, user, workflow) if runs_to_delete.present?

    samples_to_delete = current_power.destroyable_samples.where(id: sample_ids).where.not(deleted_at: nil).includes(:pipeline_runs, :workflow_runs)
    hard_delete_samples(samples_to_delete, user, workflow) if samples_to_delete.present?
  end

  def self.hard_delete_runs(runs_to_delete, user, workflow)
    deleted_run_ids = []

    run_type = runs_to_delete[0].class.name
    runs_to_delete.each do |run|
      log = DeletionLog.find_by(
        object_id: run.id,
        object_type: run_type,
        user_id: user.id
      )

      # Everything being hard deleted should have an entry in the DeletionLog table
      if log.blank?
        raise "GDPR soft deletion log not found for #{run_type} with id #{run.id} and user #{user.id}"
      end

      run_id = delete_object_with_retries(run, workflow)

      if run_id.present?
        log.update(hard_deleted_at: Time.now.utc)
        deleted_run_ids << run_id
      end
    end

    Rails.logger.info("Successfully deleted runs with ids #{deleted_run_ids} and workflow #{workflow}")
  end

  def self.hard_delete_samples(samples_to_delete, user, workflow)
    # destroy samples with no remaining runs (should have non-nil deleted_at)
    # double check pipeline/workflow runs in case any of them failed to delete
    deleted_sample_ids = []

    samples_to_delete.each do |sample|
      next unless sample.pipeline_runs.non_deprecated.count == 0 && sample.workflow_runs.non_deprecated.count == 0

      log = DeletionLog.find_by(
        object_id: sample.id,
        object_type: Sample.name,
        user_id: user.id
      )
      if log.blank?
        raise "GDPR soft deletion log not found for sample with id #{sample.id} and user #{user.id}"
      end

      sample_id = delete_object_with_retries(sample, workflow)

      if sample_id.present?
        log.update(hard_deleted_at: Time.now.utc)
        deleted_sample_ids << sample_id
      end
    end

    Rails.logger.info("Successfully deleted samples with ids #{deleted_sample_ids}")
  end

  def self.delete_object_with_retries(object, workflow)
    (1..DELETION_ATTEMPTS).each do |attempt_number|
      object.destroy!
      return object.id
    rescue StandardError => e
      if attempt_number == DELETION_ATTEMPTS
        LogUtil.log_error(
          "Bulk Deletion Error: Failed to destroy #{object.class.name} after #{DELETION_ATTEMPTS} attempts.",
          exception: e,
          object_id: object.id,
          workflow: workflow
        )
        return nil
      else
        sleep(RETRY_DELAY_SECONDS)
        LogUtil.log_message("Failed to destroy #{object.class.name} after #{attempt_number} attempts, retrying", exception: e)
      end
    end
  end
end
