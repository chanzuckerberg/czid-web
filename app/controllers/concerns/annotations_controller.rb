class AnnotationsController < ApplicationController
  NO_EDIT_ACCESS_ERROR = "You are not authorized to create annotations.".freeze

  before_action only: :create do
    allowed_feature_required("annotation")
  end

  def create
    pipeline_run_id = annotations_params[:pipeline_run_id]
    tax_id = annotations_params[:tax_id]
    content = annotations_params[:content]

    sample_id = PipelineRun.find(pipeline_run_id).sample.id
    unless edit_access?(sample_id)
      render json: {
        error: NO_EDIT_ACCESS_ERROR,
      }, status: :unauthorized
      return
    end

    Annotation.create!(
      pipeline_run_id: pipeline_run_id,
      tax_id: tax_id,
      creator_id: current_user.id,
      content: content
    )
    render json: {}, status: :ok
  rescue StandardError => e
    LogUtil.log_error(
      "Unexpected issue creating annotation: #{e}",
      exception: e,
      pipeline_run_id: pipeline_run_id,
      tax_id: tax_id
    )
    render json: { error: e }, status: :internal_server_error
  end

  private

  def edit_access?(sample_id)
    # Only users with edit access to a sample can annotate its report page.
    current_power.updatable_samples.find_by(id: sample_id)
  end

  def annotations_params
    permitted_params = [:pipeline_run_id, :tax_id, :content]
    params.permit(*permitted_params)
  end
end
