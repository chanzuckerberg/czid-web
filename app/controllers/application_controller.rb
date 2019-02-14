class ApplicationController < ActionController::Base
  protect_from_forgery with: :exception

  before_action :authenticate_user!
  before_action :check_rack_mini_profiler
  before_action :check_browser

  include Consul::Controller

  current_power do
    Power.new(current_user)
  end

  def after_sign_out_path_for(_resource_or_scope)
    root_path
  end

  def login_required
    redirect_to root_path unless current_user
  end

  def admin_required
    redirect_to root_path unless current_user && current_user.admin?
  end

  def no_demo_user
    login_required
    redirect_to root_path if current_user.demo_user?
  end

  def check_rack_mini_profiler
    if current_user && current_user.admin?
      Rack::MiniProfiler.authorize_request
    end
  end

  # Rails method for adding to logging
  def append_info_to_payload(payload)
    super
    payload[:remote_ip] = request.remote_ip
    payload[:user_id] = current_user.try(:id) if current_user
  end

  protected

  def assert_access
    # Actions which don't require access control check
    @access_checked = true
  end

  def check_access
    raise "action doesn't check against access control" unless @access_checked
  end

  # TODO: (gdingle): how is this related to request_context in ApplicationHelper?
  def request_context
    {
      enabledFeatures: current_user.allowed_featured_list
    }
  end

  def get_background_id(sample)
    background_id = params[:background_id].to_i
    if background_id > 0
      viewable_background_ids = current_power.backgrounds.pluck(:id)
      if viewable_background_ids.include?(background_id)
        return background_id
      end
    end
    sample.default_background_id
  end

  private

  def check_browser
    browser = UserAgent.parse(request.user_agent).browser
    @browser_info = {
      browser: browser,
      supported: browser != "Internet Explorer"
    }
  end
end
