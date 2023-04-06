class HardDeleteObjects
  extend InstrumentedJob
  # TODO: consider setting a max batch size to avoid having a super long job clogging up the queue
  # TODO: add retries

  @queue = :hard_delete_objects

  # object ids are pipeline run ids or workflow run ids
  def self.perform(object_ids, sample_ids, workflow, user_id)
    Rails.logger.info("Starting to hard delete runs with ids #{object_ids} and workflow #{workflow}")
    hard_delete(object_ids, sample_ids, workflow, user_id)
    Rails.logger.info("Successfully deleted runs with ids #{object_ids} and workflow #{workflow}")
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

    if object_ids.empty? && sample_ids.empty?
      raise "No runs or samples to delete"
    end

    objects = if [WorkflowRun::WORKFLOW[:short_read_mngs], WorkflowRun::WORKFLOW[:long_read_mngs]].include?(workflow)
                current_power.deletable_pipeline_runs.where(id: object_ids)
              else
                current_power.deletable_workflow_runs.where(id: object_ids)
              end

    samples_to_delete = current_power.destroyable_samples.where(id: sample_ids).where.not(deleted_at: nil).includes(:pipeline_runs, :workflow_runs)

    if (objects.count != object_ids.length) || (samples_to_delete.count != sample_ids.length)
      raise "Not all ids correspond to deletable objects"
    end

    hard_delete_runs(objects, user, workflow) if objects.present?

    hard_delete_samples(samples_to_delete, user) if samples_to_delete.present?
  end

  def self.hard_delete_runs(objects, user, workflow)
    deleted_object_ids = []
    objects_info = objects
                   .joins(:sample)
                   .select(:id, "sample_id", "samples.name AS sample_name", "samples.user_id AS sample_user_id").as_json

    objects.each do |object|
      object.destroy!
      deleted_object_ids << object.id
    rescue StandardError => e
      # If there's an error deleting one of the runs, log error to sentry but don't raise it
      LogUtil.log_error(
        "Bulk Deletion Error: Error destroying run.",
        exception: e,
        object_id: object.id,
        workflow: workflow
      )
    end

    successful_deleted_objects_info = objects_info.select { |object| deleted_object_ids.include?(object["id"]) }
    unless successful_deleted_objects_info.empty?
      MetricUtil.log_analytics_event(
        EventDictionary::GDPR_RUN_HARD_DELETED,
        user,
        {
          user_email: user.email,
          deleted_objects: successful_deleted_objects_info,
          workflow: workflow,
        }
      )
    end
  end

  def self.hard_delete_samples(samples_to_delete, user)
    # destroy samples with no remaining runs (should have non-nil deleted_at)
    # double check pipeline/workflow runs in case any of them failed to delete
    deleted_sample_ids = []
    samples_info = samples_to_delete.select(:id, "name AS sample_name", "user_id AS sample_user_id").as_json({ methods: [] })
    samples_to_delete.each do |sample|
      if sample.pipeline_runs.non_deprecated.count == 0 && sample.workflow_runs.non_deprecated.count == 0
        begin
          sample.destroy!
          deleted_sample_ids << sample.id
        rescue StandardError => e
          # Log error to sentry but don't raise it
          LogUtil.log_error(
            "Bulk Deletion Error: Could not destroy sample.",
            exception: e,
            sample_id: sample.id
          )
        end
      end
    end

    successful_deleted_samples_info = samples_info.select { |sample| deleted_sample_ids.include?(sample["id"]) }
    unless successful_deleted_samples_info.empty?
      MetricUtil.log_analytics_event(
        EventDictionary::GDPR_SAMPLE_HARD_DELETED,
        user,
        {
          user_email: user.email,
          deleted_samples: successful_deleted_samples_info,
        }
      )
    end
  end
end
