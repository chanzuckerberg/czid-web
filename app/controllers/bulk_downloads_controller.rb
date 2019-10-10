class BulkDownloadsController < ApplicationController
  include BulkDownloadTypesHelper

  before_action do
    allowed_feature_required("bulk_downloads")
  end

  # GET /bulk_downloads/types
  def types
    render json: BulkDownloadTypesHelper::BULK_DOWNLOAD_TYPES
  end

  # POST /bulk_downloads
  def create
    bulk_download_params = params.permit(:download_type, sample_ids: [], params: {})

    # Convert sample ids to pipeline run ids.
    pipeline_run_ids = (
      current_power.viewable_samples
        .where(id: bulk_download_params[:sample_ids]).includes(:pipeline_runs)
        .select do |sample|
          # Check that the most recent pipeline run succeeded.
          pr = sample.first_pipeline_run
          !pr.nil? && pr.finalized && pr.job_status == PipelineRun::STATUS_CHECKED
        end
        .map do |sample|
          # For each sample, get the most recent pipeline run.
          sample.first_pipeline_run.id
        end
    )

    # Throw an error if any sample doesn't have a valid pipeline run.
    # The user should never see this error, because the validation step should catch any issues.
    if pipeline_run_ids.length != bulk_download_params[:sample_ids].length
      render json: {
        error: BulkDownloadsHelper::GENERIC_SAMPLE_ERROR,
      },
             status: :unprocessable_entity
      return
    end

    # TODO(mark): Additional validations for each download type.
    # Create and save the bulk download.
    @bulk_download = BulkDownload.new(download_type: bulk_download_params[:download_type],
                                      pipeline_run_ids: pipeline_run_ids,
                                      params: bulk_download_params[:params],
                                      user_ids: [current_user.id],
                                      status: BulkDownload::STATUS_WAITING)

    if @bulk_download.save
      render json: @bulk_download
    else
      render json: @bulk_download.errors.full_messages, status: :unprocessable_entity
    end
  end
end
