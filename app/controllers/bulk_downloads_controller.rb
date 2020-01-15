class BulkDownloadsController < ApplicationController
  include BulkDownloadTypesHelper
  include BulkDownloadsHelper
  include AppConfigHelper

  UPDATE_WITH_TOKEN_ACTIONS = [:success_with_token, :error_with_token, :progress_with_token].freeze

  before_action except: UPDATE_WITH_TOKEN_ACTIONS do
    allowed_feature_required("bulk_downloads")
  end

  skip_before_action :authenticate_user!, :verify_authenticity_token, only: UPDATE_WITH_TOKEN_ACTIONS

  before_action :set_bulk_download_and_validate_access_token, only: UPDATE_WITH_TOKEN_ACTIONS

  # GET /bulk_downloads/types
  def types
    download_types = BulkDownloadTypesHelper.bulk_download_types

    # Filter out all types that are admin-only.
    unless current_user.admin?
      download_types = download_types.reject do |type|
        type[:admin_only]
      end
    end

    render json: download_types
  end

  # POST /bulk_downloads
  def create
    create_params = bulk_download_create_params

    # Convert sample ids to pipeline run ids.
    begin
      pipeline_run_ids = validate_bulk_download_create_params(create_params, current_user)
    rescue => e
      # Throw an error if any sample doesn't have a valid pipeline run.
      # The user should never see this error, because the validation step should catch any issues.
      LogUtil.log_backtrace(e)
      LogUtil.log_err_and_airbrake("BulkDownloadsFailedEvent: Unexpected issue creating bulk download: #{e}")
      render json: { error: e }, status: :unprocessable_entity
      return
    end

    # Convert params to a hash before passing it into the model.
    params = create_params[:params]
    params = params.to_hash if params.present?

    # Create and save the bulk download.
    bulk_download = BulkDownload.new(download_type: create_params[:download_type],
                                     pipeline_run_ids: pipeline_run_ids,
                                     params: params,
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
      LogUtil.log_err_and_airbrake(
        "BulkDownloadsFailedEvent: Failed to save bulk download for type #{create_params[:download_type]} with #{pipeline_run_ids.length} samples.
        #{bulk_download.errors.full_messages} #{params}"
      )
      render json: { error: KICKOFF_FAILURE_HUMAN_READABLE }, status: :unprocessable_entity
    end
  end

  # GET /bulk_downloads
  # GET /bulk_downloads.json
  def index
    respond_to do |format|
      format.html
      format.json do
        render json: current_power.viewable_bulk_downloads
                                  .includes(:pipeline_runs, :user)
                                  .map { |bulk_download| format_bulk_download(bulk_download, admin: current_user.admin?) }
      end
    end
  end

  # GET /bulk_downloads/:id.json
  def show
    bulk_download = viewable_bulk_download_from_params

    render json: {
      bulk_download: format_bulk_download(bulk_download, detailed: true, admin: current_user.admin?),
      download_type: BulkDownloadTypesHelper.bulk_download_type(bulk_download.download_type),
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
    @bulk_download.mark_success

    # Clear the access token, so it can no longer be used.
    update_params = { access_token: nil }

    if params[:error_type] == "FailedSrcUrlError"
      LogUtil.log_err_and_airbrake("BulkDownloadFailedSrcUrlError (id #{@bulk_download.id}): The following paths failed to process: #{params[:error_data]}")
      sample_count = SamplesHelper.get_sample_count_from_sample_paths(params[:error_data])
      update_params[:error_message] = FAILED_SAMPLES_ERROR_TEMPLATE % sample_count
    end

    @bulk_download.update(update_params)

    render json: { status: "success" }
  end

  # POST /bulk_downloads/:id/error/:access_token
  def error_with_token
    # set bulk download and validate access token in before_action
    # Clear the access token, so it can no longer be used.
    @bulk_download.update(status: BulkDownload::STATUS_ERROR, error_message: params[:error_message], access_token: nil)
    LogUtil.log_err_and_airbrake("BulkDownloadFailedError (id #{@bulk_download.id}), #{params[:error_message]}")
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
