class HardDeleteObjects
  extend InstrumentedJob
  # TODO: consider setting a max batch size to avoid having a super long job clogging up the queue
  # TODO: add retries

  @queue = :hard_delete_objects

  # object ids are pipeline run ids or workflow run ids
  def self.perform(object_ids, workflow, user_id)
    Rails.logger.info("Starting to hard delete runs with ids #{object_ids} and workflow #{workflow}")
    hard_delete_objects(object_ids, workflow, user_id)
    Rails.logger.info("Successfully deleted runs with ids #{object_ids} and workflow #{workflow}")
  rescue StandardError => e
    LogUtil.log_error(
      "Bulk Deletion Failed: #{e}.",
      object_ids: object_ids,
      workflow: workflow,
      user_id: user_id,
      exception: e
    )
    raise e
  end

  def self.hard_delete_objects(object_ids, workflow, user_id)
    user = User.find(user_id)
    current_power = Power.new(user)
    objects = if [WorkflowRun::WORKFLOW[:short_read_mngs], WorkflowRun::WORKFLOW[:long_read_mngs]].include?(workflow)
                current_power.deletable_pipeline_runs.where(id: object_ids)
              else
                current_power.deletable_workflow_runs.where(id: object_ids)
              end

    if objects.blank? || objects.count != object_ids.length
      raise "Not all ids correspond to deletable objects"
    end

    # Get associated samples before we destroy the objects
    sample_ids = objects.pluck(:sample_id)
    samples = current_power.destroyable_samples.where(id: sample_ids).includes(:pipeline_runs, :workflow_runs)

    objects.each do |object|
      object.destroy!
    rescue ActiveRecord::RecordNotDestroyed => e
      # If there's an error deleting one of the runs, log error to sentry but don't raise it
      LogUtil.log_error(
        "Bulk Deletion Error: Error destroying run.",
        object_id: object.id,
        workflow: workflow,
        exception: e
      )
    end

    # check if samples should be destroyed as well
    samples.each do |sample|
      if sample.pipeline_runs.non_deprecated.count == 0 && sample.workflow_runs.non_deprecated.count == 0
        begin
          sample.destroy!
        rescue ActiveRecord::RecordNotDestroyed => e
          # Log error to sentry but don't raise it
          LogUtil.log_error(
            "Bulk Deletion Error: Could not destroy sample.",
            sample_id: sample.id,
            exception: e
          )
        end
      end
    end
  end
end
