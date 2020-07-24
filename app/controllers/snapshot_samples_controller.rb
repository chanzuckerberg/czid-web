class SnapshotSamplesController < SamplesController
  SNAPSHOT_ACTIONS = [:show, :report_v2, :backgrounds].freeze

  # Snapshot endpoints are publicly accessible but access control is checked by set_snapshot_sample and share_id
  skip_before_action :authenticate_user!, :set_sample, :check_access, only: SNAPSHOT_ACTIONS

  before_action :app_config_required
  before_action :set_snapshot_sample, except: [:backgrounds]
  before_action :block_action, except: SNAPSHOT_ACTIONS

  # GET /pub/:share_id/samples/:id
  def show
    respond_to do |format|
      format.html
      format.json do
        render json: @sample
          .as_json(
            methods: [],
            only: SAMPLE_DEFAULT_FIELDS,
            include: {
              project: {
                only: [:id, :name],
              },
            }
          ).merge(
            default_pipeline_run_id: @pipeline_run_id,
            default_background_id: @sample.default_background_id,
            pipeline_runs: @sample.pipeline_runs_info,
            deletable: false,
            editable: false
          )
      end
    end
  end

  # GET /pub/:share_id/samples/:id/report_v2
  def report_v2
    super
  end

  # GET /pub/backgrounds.json
  def backgrounds
    @backgrounds = Background.where(public_access: 1)
    render json: { backgrounds: @backgrounds }
  end

  private

  def app_config_required
    unless get_app_config(AppConfig::ENABLE_SNAPSHOT_SHARING) == "1"
      redirect_to root_path
    end
  end

  def block_action
    redirect_to root_path
  end

  def set_snapshot_sample
    snapshot = SnapshotLink.find_by(share_id: snapshot_sample_params[:share_id])
    if snapshot.present?
      # content stored as
      # {"samples":
      #   [{1: {"pipeline_run_id": 12345}},
      #    {2: {"pipeline_run_id": 12345}}]
      # }
      content = JSON.parse(snapshot.content, symbolize_names: true)
      content[:samples].each do |sample|
        sample.each do |id, info|
          if id == snapshot_sample_params[:id].to_sym
            # TODO(ihan) add support for the "Update samples if they're rerun" option
            @sample = Sample.find(snapshot_sample_params[:id])
            @share_id = snapshot_sample_params[:share_id]
            @pipeline_run_id = info[:pipeline_run_id]
            break
          end
        end
      end
    end

    if @sample.nil?
      block_action
    end
  end

  def snapshot_sample_params
    permitted_params = [:share_id, :id]
    params.permit(*permitted_params)
  end
end
