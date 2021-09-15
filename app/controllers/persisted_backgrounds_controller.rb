class PersistedBackgroundsController < ApplicationController
  before_action :set_persisted_background, only: [:show, :update]

  PERSISTED_BACKGROUND_DEFAULT_FIELDS = [:project_id, :background_id].freeze

  # GET /persisted_backgrounds
  def index
    persisted_backgrounds = current_power.persisted_backgrounds

    render(
      json: persisted_backgrounds.as_json(only: PERSISTED_BACKGROUND_DEFAULT_FIELDS),
      status: :ok
    )
  end

  # GET /persisted_backgrounds/:project_id
  def show
    render(
      json: @persisted_background.as_json(only: PERSISTED_BACKGROUND_DEFAULT_FIELDS),
      status: :ok
    )
  end

  # POST /persisted_backgrounds
  def create
    permitted_params = persisted_background_params
    begin
      persisted_background = PersistedBackground.create!(
        user_id: current_user.id,
        project_id: permitted_params[:projectId],
        background_id: permitted_params[:backgroundId]
      )
      render(
        json: {
          message: "Persisted background successfully created",
          persisted_background_id: persisted_background.id,
        },
        status: :ok
      )
    rescue ActiveRecord::RecordInvalid => e
      render(
        json: { error: e },
        status: :unprocessable_entity
      )
    end
  end

  # PUT/PATCH /persisted_backgrounds/:project_id
  def update
    new_background_id = persisted_background_params[:backgroundId]
    begin
      @persisted_background.update!(background_id: new_background_id)
      render(
        json: @persisted_background.as_json(only: PERSISTED_BACKGROUND_DEFAULT_FIELDS),
        status: :ok
      )
    rescue ActiveRecord::RecordInvalid => e
      render(
        json: {
          persisted_background_id: @persisted_background.id,
          new_background_id: new_background_id,
          error: e,
        },
        status: :unprocessable_entity
      )
    end
  end

  private

  def persisted_background_params
    params.permit(:projectId, :backgroundId)
  end

  def set_persisted_background
    @persisted_background = current_power.persisted_backgrounds.find_by!(project_id: persisted_background_params[:projectId])
  rescue ActiveRecord::RecordNotFound
    @persisted_background = nil
    render(
      json: { error: "Persisted background not found" },
      status: :not_found
    )
  end
end
