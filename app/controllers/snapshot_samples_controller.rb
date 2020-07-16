class SnapshotSamplesController < SamplesController
  SNAPSHOT_ACTIONS = [].freeze

  before_action :app_config_required
  before_action :block_action, except: SNAPSHOT_ACTIONS

  private

  def app_config_required
    unless get_app_config(AppConfig::ENABLE_SNAPSHOT_SHARING) == "1"
      redirect_to root_path
    end
  end

  def block_action
    redirect_to root_path
  end
end
