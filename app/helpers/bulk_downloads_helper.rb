module BulkDownloadsHelper
  SAMPLE_NO_PERMISSION_ERROR = "You do not have permission to access all of the selected samples. Please contact us for help.".freeze
  SAMPLE_STILL_RUNNING_ERROR = "Some selected samples have not finished running yet. Please remove these samples and try again.".freeze
  SAMPLE_FAILED_ERROR = "Some selected samples failed their most recent run. Please remove these samples and try again.".freeze

  def get_pipeline_run_ids_for_samples(sample_ids)
    samples = current_power.viewable_samples
                           .where(id: sample_ids).includes(:pipeline_runs)

    if samples.length != sample_ids.length
      raise SAMPLE_NO_PERMISSION_ERROR
    end

    first_pipeline_runs = samples.map(&:first_pipeline_run)

    unless first_pipeline_runs.select { |pr| pr.nil? || !pr.finalized? }.empty?
      raise SAMPLE_STILL_RUNNING_ERROR
    end

    # If a pipeline run fails, its job_status will be something like "1.Host Filtering-FAILED"
    unless first_pipeline_runs.select(&:failed?).empty?
      raise SAMPLE_FAILED_ERROR
    end

    return first_pipeline_runs.map(&:id)
  end
end
