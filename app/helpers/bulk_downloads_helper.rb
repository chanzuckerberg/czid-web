module BulkDownloadsHelper
  include PipelineRunsHelper

  SAMPLE_NO_PERMISSION_ERROR = "You do not have permission to access all of the selected samples. Please contact us for help.".freeze
  SAMPLE_STILL_RUNNING_ERROR = "Some selected samples have not finished running yet. Please remove these samples and try again.".freeze
  SAMPLE_FAILED_ERROR = "Some selected samples failed their most recent run. Please remove these samples and try again.".freeze
  BULK_DOWNLOAD_NOT_FOUND = "No bulk download was found with this id".freeze

  # Check that all pipeline runs have succeeded for the provided samples
  # and return the pipeline run ids.
  # Raise an error if any pipeline runs have not succeeded.
  def get_valid_pipeline_run_ids_for_samples(samples)
    begin
      pipeline_runs = get_succeeded_pipeline_runs_for_samples(samples, true)
    rescue => e
      # Convert the error to a human-readable error.
      if e.message == PipelineRunsHelper::PIPELINE_RUN_STILL_RUNNING_ERROR
        raise SAMPLE_STILL_RUNNING_ERROR
      elsif e.message == PipelineRunsHelper::PIPELINE_RUN_FAILED_ERROR
        raise SAMPLE_FAILED_ERROR
      else
        LogUtil.log_err_and_airbrake("BulkDownloadsFailedEvent: Unexpected issue getting valid pipeline runs for samples: #{e}")
        raise
      end
    end

    return pipeline_runs.map(&:id)
  end

  def format_bulk_download(bulk_download, with_pipeline_runs = false)
    formatted_bulk_download = bulk_download.as_json
    formatted_bulk_download[:num_samples] = bulk_download.pipeline_runs.length
    formatted_bulk_download[:download_name] = BulkDownloadTypesHelper::BULK_DOWNLOAD_TYPE_TO_DISPLAY_NAME[bulk_download.download_type]
    unless bulk_download.params_json.nil?
      formatted_bulk_download[:params] = JSON.parse(bulk_download.params_json)
    end

    if with_pipeline_runs
      formatted_bulk_download[:pipeline_runs] = bulk_download.pipeline_runs.map do |pipeline_run|
        {
          "id": pipeline_run.id,
          "sample_name": pipeline_run.sample.name,
        }
      end
    end
    formatted_bulk_download
  end
end
