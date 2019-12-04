class ApplicationController < ActionController::Base
  protect_from_forgery with: :exception

  before_action :sign_in_auth0_token!
  before_action :authenticate_user!
  before_action :check_for_maintenance
  before_action :check_rack_mini_profiler
  before_action :check_browser
  before_action :set_current_context_for_logging!
  before_action :set_application_view_variables

  include Consul::Controller
  include AppConfigHelper
  include Auth0Helper

  current_power do
    Power.new(current_user)
  end

  def login_required
    redirect_to root_path unless current_user
  end

  def admin_required
    redirect_to root_path unless current_user && current_user.admin?
  end

  # This method checks if auth0 token is present and valid
  # and then sets the current user,
  # This method allows auth0 authentication to work simultaneously
  # with legacy devise database mode.
  def sign_in_auth0_token!
    @auth0_token = auth0_decode_auth_token
    if @auth0_token
      if @auth0_token[:authenticated] && (!user_signed_in? || @auth0_token.dig(:auth_payload, :email) != current_user.email)
        auth_payload = @auth0_token[:auth_payload]
        auth_user = User.find_by(email: auth_payload["email"])
        if auth_user.present?
          sign_in auth_user
          return
        else
          auth0_logout
          redirect_to root_path
        end
      end
    end
  end

  def authenticate_user!
    if @auth0_token && !@auth0_token[:authenticated]
      # redirect user if auth0 token is invalid or expired
      respond_to do |format|
        format.html do
          # we want to redirect user to auth0 login page in silent mode
          # if the user still have a valid SSO token in the auth0 session
          # the sliding session will be refreshed
          redirect_to "/auth0/refresh_token?mode=expired"
        end
        format.json { render json: { errors: ['Not Authenticated'] }, status: :unauthorized }
      end
    else
      super
    end
  end

  # To use in before_action with parameters, do
  # before_action do
  #   allowed_feature_required(...)
  # end
  def allowed_feature_required(allowed_feature, allow_admin = false)
    redirect_to root_path unless current_user && (
      current_user.allowed_feature?(allowed_feature) || (allow_admin && current_user.admin?)
    )
  end

  def check_for_maintenance
    if get_app_config(AppConfig::DISABLE_SITE_FOR_MAINTENANCE) == "1"
      redirect_to maintenance_path
    end
  end

  # Rails method for adding to logging
  def append_info_to_payload(payload)
    super
    payload[:remote_ip] = request.remote_ip
    payload[:user_id] = current_user.try(:id) if current_user
  end

  def disable_header_navigation
    @disable_header_navigation = true
  end

  protected

  def assert_access
    # Actions which don't require access control check
    @access_checked = true
  end

  def check_access
    raise "action doesn't check against access control" unless @access_checked
  end

  def get_background_id(sample, background_id = nil)
    background_id = (background_id || params[:background_id]).to_i
    if background_id > 0
      viewable_background_ids = current_power.backgrounds.pluck(:id)
      if viewable_background_ids.include?(background_id)
        return background_id
      end
    end
    sample.default_background_id
  end

  # This method is only used to login users using tokens
  # It is not intended to replace the authenticate_user! method, which
  # must be invoked regardless.
  # authenticate_user! is used for verifying if the user is already logged in
  # and redirecting to the homepage in case they are not.
  def token_based_login_support
    user_email = request.headers['X-User-Email'] || params[:user_email]
    user_token = request.headers['X-User-Token'] || params[:user_token]

    if user_email.present? && user_token.present?
      user = User.find_by(email: user_email)

      # Devise.secure_compare is used to mitigate timing attacks.
      if user && Devise.secure_compare(user.authentication_token, user_token)
        sign_in user, store: false
        return
      end
    end
  end

  private

  def check_browser
    browser = UserAgent.parse(request.user_agent).browser
    @browser_info = {
      browser: browser,
      supported: browser != "Internet Explorer",
    }
  end

  # Disabled by default. Add param ?pp=enable to enable or ?pp=disable to disable for your session.
  # See https://github.com/chanzuckerberg/idseq-web/wiki/%5BDev%5D-Profiling-and-performance-optimization
  def check_rack_mini_profiler
    if current_user && current_user.admin?
      Rack::MiniProfiler.authorize_request
    end
  end

  def set_application_view_variables
    @disable_header_navigation = false
  end

  # Set current user and request to global for use in logging in ActiveRecord.
  # See https://stackoverflow.com/a/11670283/200312
  def set_current_context_for_logging!
    ApplicationRecord._current_user = current_user if current_user
    ApplicationRecord._current_request = request if request
  rescue => e
    Rails.logger.error(e)
  end

  def instrument_with_timer
    unless @timer.nil?
      # Since we are using an instance variable, we should not instantiate timer twice.
      Rails.logger.warn("Previous instance of timer will be replaced")
    end

    @timer = Timer.new("#{params[:controller]}.#{params[:action]}")
    yield
    @timer.publish
  end
end
