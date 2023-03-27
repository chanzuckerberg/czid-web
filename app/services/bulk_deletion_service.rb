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
    delete_timestamp = Time.now.utc

    # If mngs, get pipeline runs from sample ids and clean up visualizations.
    # If workflow runs, get workflow run objects from workflow run ids.
    if WorkflowRun::MNGS_WORKFLOWS.include?(workflow)
      technology = WorkflowRun::MNGS_WORKFLOW_TO_TECHNOLOGY[workflow]
      deletable_objects = current_power.deletable_pipeline_runs.where(sample_id: object_ids, technology: technology).non_deprecated
      visualizations = Visualization.joins(:samples).where("sample_id IN (?)", object_ids).distinct

      # Table/Tree visualizations are only associated with one sample (unrelated to phylotree).
      visualizations.where(visualization_type: ["table", "tree"]).each(&:destroy)

      # Remove samples from existing heatmaps (heatmaps have >2 samples).
      heatmaps = visualizations.where(visualization_type: "heatmap")
      heatmaps.each do |heatmap|
        n_samples_after_deletion = heatmap.sample_ids.length - heatmap.sample_ids.to_a.count { |sample_id| object_ids.include? sample_id }

        # If too few samples will be left after deletion, remove the heatmap entirely
        if n_samples_after_deletion < 2
          heatmap.destroy!
        # Otherwise, only remove the samples from the heatmap
        else
          heatmap.samples = heatmap.samples.select { |sample| object_ids.exclude? sample.id }
        end
      end
    else
      # This is redundant for right now but will be used when we mark workflow runs as "deleted"
      deletable_objects = current_power.deletable_workflow_runs.where(id: object_ids).by_workflow(workflow).non_deprecated
    end

    deletable_objects.update(deleted_at: delete_timestamp)

    # Mark associated bulk downloads for deletion. Unlike `.update`, `.update_attribute` skips model validations (i.e.
    # column X must satisfy certain conditions), and skips updating `updated_at`. This is needed to make sure we mark
    # for deletion old rows that were created before we added new validations to the model (which would now fail, but
    # we still want to delete them regardless), e.g. see `validate :params_checks` in bulk_download.rb.
    # rubocop:disable Rails/SkipsModelValidations
    deletable_objects.each do |run|
      run.bulk_downloads.update_all(deleted_at: delete_timestamp)
    end
    # rubocop:enable Rails/SkipsModelValidations

    # launch async job for hard deletion
    object_ids = deletable_objects.pluck(:id)
    Resque.enqueue(HardDeleteObjects, object_ids, workflow, user.id)

    return {
      deleted_ids: object_ids,
    }
  end
end
