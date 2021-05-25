class WorkflowRunsController < ApplicationController
  include SamplesHelper
  include ParameterSanitization

  before_action :set_workflow_run, only: [:show, :results, :rerun, :zip_link]
  before_action :admin_required, only: [:rerun]

  MAX_PAGE_SIZE = 100

  def index
    permitted_params = index_params

    filters = permitted_params.slice(:sample_filters, :workflow_run_filters)
    workflow_runs = fetch_workflow_runs(domain: permitted_params[:domain], filters: filters)

    paginated_workflow_runs = paginate_workflow_runs(
      workflow_runs: workflow_runs,
      order_by: permitted_params[:orderBy],
      order_dir: permitted_params[:orderDir],
      offset: permitted_params[:offset] ? permitted_params[:offset].to_i : 0,
      limit: permitted_params[:limit] ? permitted_params[:limit].to_i : WorkflowRunsController::MAX_PAGE_SIZE
    )

    formatted_workflow_runs = format_workflow_runs(workflow_runs: paginated_workflow_runs, format: permitted_params[:format] || "basic")
    should_list_all_workflow_run_ids = ActiveModel::Type::Boolean.new.cast(permitted_params[:listAllIds])

    response = {}.tap do |resp|
      resp[:workflow_runs] = formatted_workflow_runs
      resp[:all_workflow_run_ids] = paginated_workflow_runs.pluck(:id) if should_list_all_workflow_run_ids
    end

    render(
      json: response.to_json,
      status: :ok
    )
  end

  def show
    render(
      json: @workflow_run.as_json,
      status: :ok
    )
  end

  def results
    render(
      json: @workflow_run.results,
      status: :ok
    )
  rescue NameError
    render(
      json: { status: "Workflow Run action not supported" },
      status: :not_found
    )
  end

  def rerun
    @workflow_run.rerun
    render json: { status: "success" }, status: :ok
  rescue StandardError => e
    LogUtil.log_error("Rerun trigger failed", exception: e, workflow_id: @workflow_run.id)
    render json: {
      status: "error",
      message: e.message,
    }, status: :ok
  end

  # Top-level zipped pipeline results
  def zip_link
    path = @workflow_run.zip_link
    if path
      redirect_to path
    else
      render(
        json: { status: "Output not available" },
        status: :not_found
      )
    end
  end

  private

  def set_workflow_run
    workflow_run = current_power.workflow_runs.find(params[:id])
    workflow_class = WorkflowRun::WORKFLOW_CLASS[workflow_run.workflow]
    @workflow_run = workflow_class ? workflow_run.becomes(workflow_class) : workflow_run
  rescue ActiveRecord::RecordNotFound
    @workflow_run = nil
    render(
      json: { status: "Workflow Run not found" },
      status: :not_found
    )
  end

  def index_params
    permitted_sample_filters = [:host, :locationV2, :tissue]
    permitted_workflow_run_filters = [:workflow]

    permitted_params = [:domain, :format, :offset, :limit, :orderBy, :orderDir, :listAllIds, sample_filters: permitted_sample_filters, workflow_run_filters: permitted_workflow_run_filters]
    params.permit(*permitted_params)
  end

  def fetch_workflow_runs(domain:, filters: {})
    samples = fetch_samples(domain: domain, filters: filters[:sample_filters])
    samples_workflow_runs = current_power.samples_workflow_runs(samples).non_deprecated

    filtered_workflow_runs = filter_workflow_runs(workflow_runs: samples_workflow_runs, filters: filters[:workflow_run_filters])
    filtered_workflow_runs
  end

  def format_workflow_runs(workflow_runs:, format: "basic")
    return [] if workflow_runs.empty?

    should_include_sample_info = format == "with_sample_info"
    if should_include_sample_info
      sample_ids = workflow_runs.pluck(:sample_id).uniq
      sample_attributes = [:id, :created_at, :host_genome_id, :name, :private_until, :project_id, :sample_notes]
      metadata_by_sample_id = Metadatum.by_sample_ids(sample_ids)
      samples_visibility_by_sample_id = get_visibility_by_sample_id(sample_ids)
      workflow_runs = workflow_runs.includes(sample: [:project, :user])
    end

    formatted_workflow_runs = workflow_runs.reduce([]) do |formatted_wrs, wr|
      formatted_wrs << {}.tap do |formatted_wr|
        formatted_wr[:id] = wr.id
        formatted_wr[:workflow] = wr.workflow
        formatted_wr[:created_at] = wr.created_at
        formatted_wr[:status] = WorkflowRun::SFN_STATUS_MAPPING[wr.status]
        formatted_wr[:cached_results] = wr.parsed_cached_results

        formatted_wr[:inputs] = {}.tap do |wr_info|
          # Since the only workflow we currently have is CG, we can skip checking if this WR is a CG WR.
          # TODO: Check if WR.workflow == CG if another workflow is introduced
          wr_info[:technology] = ConsensusGenomeWorkflowRun::TECHNOLOGY_NAME[wr.get_input("technology")]&.capitalize
          wr_info[:wetlab_protocol] = wr.get_input("wetlab_protocol")
          wr_info[:medaka_model] = wr.get_input("medaka_model")
        end

        if should_include_sample_info
          wr_sample = wr.sample
          formatted_wr[:sample] = {}.tap do |formatted_sample|
            formatted_sample[:info] = wr_sample.slice(sample_attributes)
            formatted_sample[:info][:public] = samples_visibility_by_sample_id[wr_sample.id]
            formatted_sample[:info].merge!(get_result_status_description_for_errored_sample(wr_sample)) if wr_sample.upload_error.present?
            formatted_sample[:metadata] = metadata_by_sample_id[wr_sample.id]
            formatted_sample[:project_name] = wr_sample.project.name
            formatted_sample[:uploader] = sample_uploader(wr_sample)
          end
        end
      end
    end

    formatted_workflow_runs
  end

  def filter_workflow_runs(workflow_runs:, filters: {})
    if filters.present?
      workflow = filters[:workflow]
      workflow_runs = workflow_runs.by_workflow(workflow) if workflow.present?
    end

    workflow_runs
  end

  def paginate_workflow_runs(workflow_runs:, order_by: :id, order_dir: :desc, offset: 0, limit: WorkflowRunsController::MAX_PAGE_SIZE)
    order_by = sanitize_order_by(WorkflowRun, order_by, :id)
    order_dir = sanitize_order_dir(order_dir, :desc)

    workflow_runs.order(Hash[order_by => order_dir]).offset(offset).limit(limit)
  end
end
