# This service is used to validate sample ids or workflow run ids for deletion.
# When called with a list of query ids, a user, and a workflow, it returns a list
# of valid ids and a list of invalid sample names. For pipeline runs, query ids and valid ids
# will be sample ids; for workflow runs query ids and valid ids will be workflow run ids.
# This matches the data type of selectedIds on the Discovery View.
class DeletionValidationService
  include Callable
  include SamplesHelper

  class WorkflowMissingError < StandardError
    def initialize
      super("Workflow missing from call to deletion validation service")
    end
  end

  DELETION_VALIDATION_ERROR = "Error validating objects for deletion.".freeze

  def initialize(query_ids:, user:, workflow:)
    if query_ids.blank?
      Rails.logger.warn("DeletionValidationService called with query_ids = nil")
      @query_ids = []
    else
      @query_ids = query_ids.map(&:to_i)
    end

    if workflow.nil?
      raise WorkflowMissingError
    end

    @workflow = workflow
    @user = user
  end

  def call
    error = nil
    result = {
      valid_ids: [],
      invalid_sample_ids: [],
      error: error,
    }

    begin
      if [WorkflowRun::WORKFLOW[:short_read_mngs], WorkflowRun::WORKFLOW[:long_read_mngs]].include?(@workflow)
        validated_objects = validate_samples_for_pipeline_run_deletion(user: @user, sample_ids: @query_ids, workflow: @workflow)
      elsif [WorkflowRun::WORKFLOW[:consensus_genome], WorkflowRun::WORKFLOW[:amr]].include?(@workflow)
        validated_objects = validate_workflow_runs_for_deletion(user: @user, workflow_run_ids: @query_ids, workflow: @workflow)
      else
        raise WorkflowNotFoundError
      end
    rescue StandardError => e
      LogUtil.log_error(
        "DeletionValidationEvent: Unexpected issue validating objects for deletion: #{e}",
        exception: e,
        query_ids: @query_ids,
        user_id: @user.id,
        workflow: @workflow
      )
      error = DELETION_VALIDATION_ERROR
    end

    if error.nil?
      result[:valid_ids] = validated_objects[:valid_ids]
      result[:invalid_sample_ids] = validated_objects[:invalid_sample_ids]
    else
      result[:error] = error
    end
    return result
  end

  private

  def validate_samples_for_pipeline_run_deletion(user:, sample_ids:, workflow:)
    current_power = Power.new(user)

    technology = if workflow == WorkflowRun::WORKFLOW[:short_read_mngs]
                   PipelineRun::TECHNOLOGY_INPUT[:illumina]
                 else
                   PipelineRun::TECHNOLOGY_INPUT[:nanopore]
                 end

    deletable_pipeline_runs = current_power.deletable_pipeline_runs.where(sample_id: sample_ids, technology: technology).non_deprecated
    valid_sample_ids = deletable_pipeline_runs.pluck(:sample_id)
    invalid_sample_ids = sample_ids.reject { |id| valid_sample_ids.include?(id) }

    return {
      valid_ids: valid_sample_ids,
      invalid_sample_ids: invalid_sample_ids,
    }
  end

  def validate_workflow_runs_for_deletion(user:, workflow_run_ids:, workflow:)
    current_power = Power.new(user)

    deletable_workflow_run_ids = current_power.deletable_workflow_runs
                                              .where(id: workflow_run_ids)
                                              .by_workflow(workflow)
                                              .non_deprecated.pluck(:id)

    invalid_workflow_run_ids = workflow_run_ids.reject { |id| deletable_workflow_run_ids.include?(id) }

    invalid_workflow_runs = current_power.workflow_runs.where(id: invalid_workflow_run_ids)
    invalid_sample_ids = invalid_workflow_runs.pluck(:sample_id)
    return {
      valid_ids: deletable_workflow_run_ids,
      invalid_sample_ids: invalid_sample_ids,
    }
  end
end
