# Deletes pipeline/workflow runs and samples in the background.
# If batching this job, make sure it is a low priority for the workers
# so that the other web app Resque jobs are not stalled when large deletions occur.
class HardDeleteObjects
  extend InstrumentedJob

  @queue = :hard_delete_objects
  DELETION_ATTEMPTS = 2 # retry deletion of object in case we hit a random deadlock
  RETRY_DELAY_SECONDS = 20

  # object ids are pipeline run ids or workflow run ids
  def self.perform(object_ids, sample_ids, workflow, user_id)
    Rails.logger.info("Starting to hard delete runs with ids #{object_ids} and workflow #{workflow}")
    hard_delete(object_ids, sample_ids, workflow, user_id)
  rescue StandardError => e
    LogUtil.log_error(
      "Bulk Deletion Failed: #{e}.",
      exception: e,
      object_ids: object_ids,
      sample_ids: sample_ids,
      workflow: workflow,
      user_id: user_id
    )
    raise e
  end

  def self.hard_delete(object_ids, sample_ids, workflow, user_id)
    user = User.find(user_id)
    current_power = Power.new(user)

    objects = if [WorkflowRun::WORKFLOW[:short_read_mngs], WorkflowRun::WORKFLOW[:long_read_mngs]].include?(workflow)
                current_power.deletable_pipeline_runs.where(id: object_ids)
              else
                current_power.deletable_workflow_runs.where(id: object_ids)
              end

    # note: we have a scheduled lambda that cleans up taxa from ES for
    # pipeline runs no longer in the database
    hard_delete_runs(objects, user, workflow) if objects.present?

    samples_to_delete = current_power.destroyable_samples.where(id: sample_ids).where.not(deleted_at: nil).includes(:pipeline_runs, :workflow_runs)
    hard_delete_samples(samples_to_delete, user, workflow) if samples_to_delete.present?
  end

  def self.hard_delete_runs(objects, user, workflow)
    deleted_object_ids = []
    objects_info = objects
                   .joins(:sample, sample: :project)
                   .select(
                     :id,
                     "sample_id",
                     "samples.name AS sample_name",
                     "samples.user_id AS sample_user_id",
                     "projects.name AS project_name",
                     "projects.id AS project_id"
                   ).as_json

    objects.each do |object|
      object_id = delete_object_with_retries(object, workflow)
      deleted_object_ids << object.id if object_id.present?
    end

    successful_deleted_objects_info = objects_info.select { |object| deleted_object_ids.include?(object["id"]) }
    successful_deleted_objects_info.each do |object|
      MetricUtil.log_analytics_event(
        EventDictionary::GDPR_RUN_HARD_DELETED,
        user,
        {
          user_email: user.email,
          run_id: object["id"],
          sample_id: object["sample_id"],
          sample_name: object["sample_name"],
          sample_user_id: object["sample_user_id"],
          project_name: object["project_name"],
          project_id: object["project_id"],
          workflow: workflow,
        }
      )
    end
    Rails.logger.info("Successfully deleted runs with ids #{deleted_object_ids} and workflow #{workflow}")
  end

  def self.hard_delete_samples(samples_to_delete, user, workflow)
    # destroy samples with no remaining runs (should have non-nil deleted_at)
    # double check pipeline/workflow runs in case any of them failed to delete
    deleted_sample_ids = []
    samples_info = samples_to_delete.joins(:project).select(
      "samples.id AS sample_id",
      "samples.name AS sample_name",
      "samples.user_id AS sample_user_id",
      "projects.name AS project_name",
      "projects.id AS project_id"
    ).as_json({ methods: [] })

    samples_to_delete.each do |sample|
      if sample.pipeline_runs.non_deprecated.count == 0 && sample.workflow_runs.non_deprecated.count == 0
        sample_id = delete_object_with_retries(sample, workflow)
        deleted_sample_ids << sample_id if sample_id.present?
      end
    end

    successful_deleted_samples_info = samples_info.select { |sample_info| deleted_sample_ids.include?(sample_info["sample_id"]) }
    successful_deleted_samples_info.each do |sample_info|
      MetricUtil.log_analytics_event(
        EventDictionary::GDPR_SAMPLE_HARD_DELETED,
        user,
        {
          user_email: user.email,
          sample_id: sample_info["sample_id"],
          sample_name: sample_info["sample_name"],
          sample_user_id: sample_info["sample_user_id"],
          project_name: sample_info["project_name"],
          project_id: sample_info["project_id"],
        }
      )
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
