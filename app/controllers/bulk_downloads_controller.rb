class BulkDownloadsController < ApplicationController
  include BulkDownloadTypesHelper
  include BulkDownloadsHelper

  UPDATE_WITH_TOKEN_ACTIONS = [:success_with_token, :error_with_token, :progress_with_token].freeze

  before_action except: UPDATE_WITH_TOKEN_ACTIONS do
    allowed_feature_required("bulk_downloads")
  end

  skip_before_action :authenticate_user!, :verify_authenticity_token, only: UPDATE_WITH_TOKEN_ACTIONS

  before_action :set_bulk_download_and_validate_access_token, only: UPDATE_WITH_TOKEN_ACTIONS

  # GET /bulk_downloads/types
  def types
    render json: BulkDownloadTypesHelper::BULK_DOWNLOAD_TYPES
  end

  # POST /bulk_downloads
  def create
    create_params = bulk_download_create_params
    # Convert sample ids to pipeline run ids.
    begin
      sample_ids = create_params[:sample_ids]
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
    bulk_download = BulkDownload.new(download_type: create_params[:download_type],
                                     pipeline_run_ids: pipeline_run_ids,
                                     params: create_params[:params],
                                     status: BulkDownload::STATUS_WAITING,
                                     user_id: current_user.id)

    if bulk_download.save
      begin
        bulk_download.kickoff
        render json: bulk_download
      rescue => e
        # If the kickoff failed, set to error.
        bulk_download.update(status: BulkDownload::STATUS_ERROR)
        LogUtil.log_backtrace(e)
        LogUtil.log_err_and_airbrake("BulkDownloadsKickoffError: Unexpected issue kicking off bulk download: #{e}")
        render json: {
          error: BulkDownloadsHelper::KICKOFF_FAILURE_HUMAN_READABLE,
          bulk_download: bulk_download,
        }, status: :internal_server_error
      end
    else
      render json: bulk_download.errors.full_messages, status: :unprocessable_entity
    end
  end

  # GET /bulk_downloads
  # GET /bulk_downloads.json
  def index
    respond_to do |format|
      format.html
      format.json do
        render json: current_power.viewable_bulk_downloads
                                  .includes(:pipeline_runs)
                                  .map { |bulk_download| format_bulk_download(bulk_download) }
      end
    end
  end

  # GET /bulk_downloads/:id.json
  def show
    bulk_download = viewable_bulk_download_from_params

    render json: {
      bulk_download: format_bulk_download(bulk_download, true),
      download_type: BulkDownloadTypesHelper::BULK_DOWNLOAD_TYPES.find do |bulk_download_type|
        bulk_download_type[:type] == bulk_download.download_type
      end,
    }
  rescue ActiveRecord::RecordNotFound
    render json: { error: BulkDownloadsHelper::BULK_DOWNLOAD_NOT_FOUND }, status: :not_found
  end

  # GET /bulk_downloads/:id/presigned_output_url
  def presigned_output_url
    bulk_download = viewable_bulk_download_from_params

    if bulk_download.status != BulkDownload::STATUS_SUCCESS
      render json: { error: BulkDownloadsHelper::OUTPUT_FILE_NOT_SUCCESSFUL }, status: :not_found
      return
    end

    presigned_url = bulk_download.output_file_presigned_url

    if presigned_url.nil?
      render json: { error: BulkDownloadsHelper::PRESIGNED_URL_GENERATION_ERROR }, status: :internal_server_error
      return
    end
    render json: presigned_url
  rescue ActiveRecord::RecordNotFound
    render json: { error: BulkDownloadsHelper::BULK_DOWNLOAD_NOT_FOUND }, status: :not_found
  end

  # POST /bulk_downloads/:id/success/:access_token
  def success_with_token
    # set bulk download and validate access token in before_action
    @bulk_download.update(status: BulkDownload::STATUS_SUCCESS)

    if params[:error_type] == "FailedSrcUrlError"
      LogUtil.log_err_and_airbrake("BulkDownloadFailedSrcUrlError: The following paths failed to process: #{params[:error_data]}")
      @bulk_download.update(error_message: FAILED_SRC_URL_ERROR_TEMPLATE % params[:error_data].length)
    end

    render json: { status: "success" }
  end

  # POST /bulk_downloads/:id/error/:access_token
  def error_with_token
    # set bulk download and validate access token in before_action
    @bulk_download.update(status: BulkDownload::STATUS_ERROR, error_message: params[:error_message])
    LogUtil.log_err_and_airbrake("BulkDownloadFailedError: #{params[:error_message]}")
    render json: { status: "success" }
  end

  # POST /bulk_downloads/:id/progress/:access_token
  def progress_with_token
    # set bulk download and validate access token in before_action
    @bulk_download.update(progress: params[:progress].to_f)
    render json: { status: "success" }
  end

  def set_bulk_download_and_validate_access_token
    @bulk_download = BulkDownload.find(params[:id])
    unless @bulk_download.validate_access_token(params[:access_token])
      render json: { error: BulkDownloadsHelper::INVALID_ACCESS_TOKEN }, status: :unauthorized
    end
  rescue ActiveRecord::RecordNotFound
    render json: { error: BulkDownloadsHelper::BULK_DOWNLOAD_NOT_FOUND }, status: :not_found
    # Rendering halts the filter chain
  end

  def viewable_bulk_download_from_params
    current_power.viewable_bulk_downloads.find(params[:id])
  end

  def bulk_download_create_params
    params.permit(:download_type, sample_ids: [], params: {})
  end
end
