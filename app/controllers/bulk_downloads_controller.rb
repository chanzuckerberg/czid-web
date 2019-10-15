class BulkDownloadsController < ApplicationController
  include BulkDownloadTypesHelper
  include BulkDownloadsHelper

  before_action do
    allowed_feature_required("bulk_downloads")
  end

  # GET /bulk_downloads/types
  def types
    render json: BulkDownloadTypesHelper::BULK_DOWNLOAD_TYPES
  end

  # POST /bulk_downloads
  def create
    # Convert sample ids to pipeline run ids.
    begin
      sample_ids = bulk_download_params[:sample_ids]
      # Access control check.
      viewable_samples = current_power.viewable_samples.where(id: sample_ids)
      if viewable_samples.length != sample_ids.length
        raise BulkDownloadsHelper::SAMPLE_NO_PERMISSION_ERROR
      end

      pipeline_run_ids = get_valid_pipeline_run_ids_for_samples(viewable_samples)
    rescue => e
      # Throw an error if any sample doesn't have a valid pipeline run.
      # The user should never see this error, because the validation step should catch any issues.
      LogUtil.log_err_and_airbrake("BulkDownloadsFailedEvent: Unexpected issue creating bulk download: #{e}")
      render json: { error: e }, status: :unprocessable_entity
      return
    end

    # TODO(mark): Additional validations for each download type.
    # Create and save the bulk download.
    @bulk_download = BulkDownload.new(download_type: bulk_download_params[:download_type],
                                      pipeline_run_ids: pipeline_run_ids,
                                      params: bulk_download_params[:params],
                                      status: BulkDownload::STATUS_WAITING,
                                      user_id: current_user.id)

    if @bulk_download.save
      render json: @bulk_download
    else
      render json: @bulk_download.errors.full_messages, status: :unprocessable_entity
    end
  end
end

def bulk_download_params
  params.permit(:download_type, sample_ids: [], params: {})
end
