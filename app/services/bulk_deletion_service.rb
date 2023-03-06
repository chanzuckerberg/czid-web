# This service performs the immediate actions necessary for bulk
# deletion of pipeline or workflow runs, then kicks off an async job
# to hard delete the runs.
# It accepts deletable workflow run ids or sample ids as object_ids argument, user,
# and workflow. It returns an array of deleted pipeline run or workflow run ids.
class BulkDeletionService
  include Callable

  def initialize(object_ids:, user:, workflow:)
    if object_ids.blank?
      Rails.logger.warn("BulkDeletionService called with object_ids = nil")
      @object_ids = []
    else
      @object_ids = object_ids.map(&:to_i)
    end

    if workflow.nil?
      raise DeletionValidationService::WorkflowMissingError
    end

    @user = user
    @workflow = workflow
  end

  def call
    error = nil
    deleted_ids = []

    begin
      deleted_objects = bulk_delete_objects(object_ids: @object_ids, workflow: @workflow, user: @user)
    rescue StandardError => e
      LogUtil.log_error(
        "BulkDeletionEvent: Unexpected issue handling bulk deletion of objects: #{e}",
        exception: e,
        object_ids: @object_ids,
        workflow: @workflow,
        user_id: @user.id
      )
      error = "Bulk Deletion Error: #{e}"
    end

    if error.nil?
      deleted_ids = deleted_objects[:deleted_ids]
    end

    return {
      deleted_ids: deleted_ids,
      error: error,
    }
  end

  private

  def bulk_delete_objects(object_ids:, workflow:, user:)
    current_power = Power.new(user)

    # If mngs, get pipeline runs from sample ids
    # and clean up visualizations.
    # If workflow runs, get workflow run objects from workflow run ids.
    if WorkflowRun::MNGS_WORKFLOWS.include?(workflow)
      technology = WorkflowRun::MNGS_WORKFLOW_TO_TECHNOLOGY[workflow]
      deletable_objects = current_power.deletable_pipeline_runs.where(sample_id: object_ids, technology: technology).non_deprecated
    else
      # This is redundant for right now but will be used when we mark workflow runs as "deleted"
      deletable_objects = current_power.deletable_workflow_runs.where(id: object_ids).by_workflow(workflow).non_deprecated
    end

    # mark objects as "deleted"

    # delete associated bulk downloads

    # launch async job for hard deletion

    return {
      deleted_ids: deletable_objects.pluck(:id),
    }
  end
end
