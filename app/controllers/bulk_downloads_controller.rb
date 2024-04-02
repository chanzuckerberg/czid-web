class BulkDownloadsController < ApplicationController
  include BulkDownloadTypesHelper
  include BulkDownloadsHelper
  include PipelineRunsHelper
  include AppConfigHelper

  UPDATE_WITH_TOKEN_ACTIONS = [:success_with_token, :error_with_token, :progress_with_token].freeze

  skip_before_action :authenticate_user!, :verify_authenticity_token, only: UPDATE_WITH_TOKEN_ACTIONS

  before_action :set_bulk_download_and_validate_access_token, only: UPDATE_WITH_TOKEN_ACTIONS

  # GET /bulk_downloads/types
  def types
    workflow = params[:workflow]

    download_types = BulkDownloadTypesHelper.bulk_download_types

    # Filter out all types that are admin-only or require feature flags.
    unless current_user.admin?
      download_types = download_types.reject do |type|
        type[:admin_only] ||
          (type[:required_allowed_feature] && !current_user.allowed_feature?(type[:required_allowed_feature]))
      end
    end

    # Filter out types that are explicitly marked as needing to be hidden
    download_types = download_types.reject { |type| type[:hide_in_creation_modal] }

    # Only return types valid for this workflow
    # default to mngs if no workflow parameter in query
    if workflow.blank?
      workflow = WorkflowRun::WORKFLOW[:short_read_mngs]
    end
    download_types = download_types.select { |type| type[:workflows].include?(workflow) }

    render json: download_types
  end

  # GET /bulk_downloads/metrics
  def metrics
    workflow = params[:workflow]
    render json: WorkflowRun::WORKFLOW_METRICS[workflow]
  end

  # POST /bulk_downloads
  def create
    create_params = bulk_download_create_params
    unless create_params.key?(:workflow)
      create_params[:workflow] = WorkflowRun::WORKFLOW[:short_read_mngs]
    end
    pipeline_run_ids = []
    workflow_run_ids = []

    # Convert sample ids to pipeline run ids or workflow run ids.
    begin
      viewable_objects = validate_bulk_download_create_params(create_params, current_user)

      if [WorkflowRun::WORKFLOW[:short_read_mngs], WorkflowRun::WORKFLOW[:long_read_mngs]].include? create_params[:workflow]
        pipeline_run_ids = get_valid_pipeline_run_ids_for_samples(viewable_objects)
      else
        workflow_run_ids = viewable_objects.active.pluck(:id)
      end
    rescue StandardError => e
      # Throw an error if any sample doesn't have a valid pipeline or workflow run.
      # The user should never see this error, because the validation step should catch any issues.
      LogUtil.log_error(
        "BulkDownloadsFailedEvent: Unexpected issue creating bulk download: #{e}",
        exception: e,
        params: create_params
      )
      render json: { error: e }, status: :unprocessable_entity
      return
    end

    # Convert params to a hash before passing it into the model.
    params = create_params[:params]
    params = params.to_hash if params.present?

    # Create and save the bulk download.
    bulk_download = BulkDownload.new(download_type: create_params[:download_type],
                                     pipeline_run_ids: pipeline_run_ids,
                                     workflow_run_ids: workflow_run_ids,
                                     params: params,
                                     status: BulkDownload::STATUS_WAITING,
                                     user_id: current_user.id)

    if bulk_download.save
      begin
        bulk_download.kickoff
        render json: bulk_download
      rescue StandardError => e
        # If the kickoff failed, set to error.
        bulk_download.update(status: BulkDownload::STATUS_ERROR)
        LogUtil.log_error(
          "BulkDownloadsKickoffError: Unexpected issue kicking off bulk download: #{e}",
          exception: e,
          pipeline_run_ids: pipeline_run_ids,
          params: params
        )
        render json: {
          error: BulkDownloadsHelper::KICKOFF_FAILURE_HUMAN_READABLE,
          bulk_download: bulk_download,
        }, status: :internal_server_error
      end
    else
      LogUtil.log_error(
        "BulkDownloadsFailedEvent: Failed to save bulk download for type #{create_params[:download_type]} with #{pipeline_run_ids.length} samples.",
        download_type: create_params[:download_type],
        pipeline_run_ids: pipeline_run_ids,
        error_message: bulk_download.errors.full_messages,
        params: params
      )
      render json: { error: KICKOFF_FAILURE_HUMAN_READABLE }, status: :unprocessable_entity
    end
  end

  # POST /bulk_downloads/consensus_genome_overview_data.json
  def consensus_genome_overview_data
    bulk_download_params = bulk_download_create_params_with_valid_workflow
    begin
      workflow_run_ids = get_workflow_run_ids_of_viewable_objects(bulk_download_params)
    rescue StandardError
      render json: { error: KICKOFF_FAILURE_HUMAN_READABLE }, status: :unprocessable_entity
      return
    end

    workflow_runs = WorkflowRun.where(id: workflow_run_ids)
    cg_overview_arr = BulkDownloadsHelper.generate_cg_overview_data(
      workflow_runs: workflow_runs,
      include_metadata: bulk_download_params[:params]&.[](:include_metadata)&.[](:value)
    )

    render json: { cg_overview_rows: cg_overview_arr }, status: :ok
  end

  # POST /bulk_downloads/consensus_genome_sample_metadata.json
  def consensus_genome_sample_metadata
    sample_ids = validate_sample_metadata_params(consensus_genome_sample_metadata_params, current_user)

    unless sample_ids.is_a?(Array)
      render json: { error: MISSING_SAMPLE_IDS_ERROR }, status: :unprocessable_entity
      return
    end
    metadata_arr = BulkDownloadsHelper.generate_cg_sample_metadata(sample_ids, current_user)

    render json: { sample_metadata: metadata_arr }, status: :ok
  rescue StandardError => e
    LogUtil.log_error(
      "BulkDownloadsSampleMetadataError: Failed to get sample metadata #{e}",
      exception: e,
      params: consensus_genome_sample_metadata_params
    )

    render json: { error: e.message }, status: :unprocessable_entity
  end

  # GET /bulk_downloads
  # GET /bulk_downloads.json
  def index
    respond_to do |format|
      format.html
      format.json do
        scope = current_power.viewable_bulk_downloads

        # Allow admins to narrow down which bulk downloads they get
        search_by = params["searchBy"]
        max_items = params["n"]
        if current_user.admin?
          # Filter by user name or email
          if search_by.present?
            user_ids = User.where("name like ? OR email like ?", "%#{search_by}%", "%#{search_by}%").pluck(:id)
            scope = scope.where(user_id: user_ids)
          end

          # Set a max number of items
          if max_items.present?
            scope = scope.order(id: :desc).limit(max_items)
          end
        end

        render json: scope
          .includes(:pipeline_runs, :workflow_runs, :user)
          .map { |bulk_download|
          format_bulk_download(bulk_download, detailed: true, admin: current_user.admin?).merge(download_type_details: BulkDownloadTypesHelper.bulk_download_type(bulk_download.download_type))
        }
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
    @bulk_download.verify_and_mark_success

    # Clear the access token, so it can no longer be used.
    update_params = { access_token: nil }

    if params[:error_type] == "FailedSrcUrlError"
      LogUtil.log_error(
        "BulkDownloadFailedSrcUrlError (id #{@bulk_download.id}): The following paths failed to process: #{params[:error_data]}",
        bulk_download_id: @bulk_download.id,
        error_type: params[:error_type],
        error_data: params[:error_data]
      )
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
    LogUtil.log_error(
      "BulkDownloadFailedError (id #{@bulk_download.id}), #{params[:error_message]}",
      bulk_download_id: @bulk_download.id,
      error: params[:error_message]
    )
    render json: { status: "success" }
  end

  # POST /bulk_downloads/:id/progress/:access_token
  def progress_with_token
    # set bulk download and validate access token in before_action
    @bulk_download.update(progress: params[:progress].to_f)
    render json: { status: "success" }
  end

  private

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

  def bulk_download_create_params_with_valid_workflow
    create_params = bulk_download_create_params
    unless create_params.key?(:workflow)
      create_params[:workflow] = WorkflowRun::WORKFLOW[:short_read_mngs]
    end
    create_params
  end

  def bulk_download_create_params
    params.permit(:download_type, :workflow, sample_ids: [], params: {}, workflow_run_ids: [])
  end

  def consensus_genome_sample_metadata_params
    params.permit(sample_ids: [])
  end

  def get_workflow_run_ids_of_viewable_objects(bulk_download_params)
    begin
      viewable_objects = validate_bulk_download_create_params(bulk_download_params, current_user)
      workflow_run_ids = viewable_objects.active.pluck(:id)
    rescue StandardError => e
      # Throw an error if any sample doesn't have a valid pipeline or workflow run.
      # The user should never see this error, because the validation step should catch any issues.
      LogUtil.log_error(
        "BulkDownloadsFailedEvent: Unexpected issue creating bulk download: #{e}",
        exception: e,
        params: bulk_download_params
      )
      raise
    end

    workflow_run_ids
  end
end
