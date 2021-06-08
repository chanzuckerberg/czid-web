# When called with query_ids and a user provided as inputs- WorkflowRunValidationService
# returns an array of viewable workflow_runs (workflow runs that are viewable to the user specified).
# If the user does not have access to the workflow runs, WorkflowRunValidationService
# returns validation error WORKFLOW_RUN_ACCESS_ERROR
class WorkflowRunValidationService
  include Callable

  WORKFLOW_RUN_ACCESS_ERROR = "Error validating workflow runs. Please contact us for help.".freeze

  def initialize(query_ids:, current_user:)
    if query_ids.nil?
      Rails.logger.warn("WorkflowRunValidationService called with query_ids = nil")
      @query_ids = []
    else
      @query_ids = query_ids.map(&:to_i)
    end
    @user = current_user
  end

  def call
    error = nil
    result = { viewable_workflow_runs: [], error: error }

    begin
      viewable_workflow_runs = validate_workflow_run_access(workflow_run_ids: @query_ids, user: @user)
    rescue StandardError => e
      LogUtil.log_error(
        "WorkflowRunValidationFailedEvent: Unexpected issue validating workflow run access: #{e}",
        exception: e,
        query_ids: @query_ids,
        user_id: @user.id
      )
      error = WORKFLOW_RUN_ACCESS_ERROR
    end

    if error.nil?
      result[:viewable_workflow_runs] = viewable_workflow_runs
    else
      result[:error] = error
    end

    return result
  end

  private

  # Returns only the workflow runs viewable by the current user.
  # Raises an error if more than the max workflow runs allowed are passed.
  def validate_workflow_run_access(workflow_run_ids:, user:)
    current_power = Power.new(user)

    # Filter out workflow runs the user shouldn't be able to view and logs it
    viewable_workflow_runs = current_power.workflow_runs.where(id: workflow_run_ids)
    if viewable_workflow_runs.length != workflow_run_ids.length
      viewable_ids = viewable_workflow_runs.map(&:id)
      unviewable_workflow_runs = workflow_run_ids.reject { |id| viewable_ids.include?(id) }
      Rails.logger.warn("WorkflowRunValidationImproperAccessEvent: User with id #{user.id} made a request for workflow_runs they don't have access to: #{unviewable_workflow_runs}")
    end

    return viewable_workflow_runs
  end
end
