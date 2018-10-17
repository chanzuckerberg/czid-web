class ApplicationController < ActionController::Base
  before_action :authenticate_user!
  before_action :check_browser
  protect_from_forgery with: :exception
  before_action :check_rack_mini_profiler

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

  private

  def check_browser
    user_agent = UserAgent.parse(request.user_agent)
    if user_agent.browser == "Internet Explorer"
      render layout: "unsupported_browser"
    end
  end
end
