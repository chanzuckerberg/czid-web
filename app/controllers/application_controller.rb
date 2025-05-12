class ApplicationController < ActionController::Base
  before_action :authenticate_user!
  before_action :check_for_maintenance
  before_action :check_rack_mini_profiler
  before_action :check_browser
  before_action :set_current_context_for_logging!
  before_action :set_application_view_variables
  before_action :set_raven_context

  include Consul::Controller
  include AppConfigHelper
  include Auth0Helper
  include ApplicationHelper

  current_power do
    Power.new(current_user)
  end

  def login_required
    redirect_to root_path unless current_user
  end

  def admin_required
    redirect_to root_path unless current_user && current_user.admin?
  end

  def authenticate_user!
    if @token_based_login_request
      # in token based requests there is no auth0 token to validate, and the user is already validated
      return true
    end

    auth_check = auth0_check_user_auth(current_user)

    case auth_check
    when AUTH_INVALID_USER
      respond_to do |format|
        format.html { redirect_to  controller: :auth0, action: :login }
        format.json { render json: { errors: ['Not Authenticated'] }, status: :unauthorized }
      end
    when AUTH_TOKEN_EXPIRED
      respond_to do |format|
        # we want to redirect user to auth0 login page in silent mode
        # because the user may still have a valid SSO token in the auth0 session.
        # in this case the sliding session will be refreshed, otherwise user will be
        # required to enter email and password
        format.html { redirect_to controller: :auth0, action: :refresh_token, params: { mode: "expired" } }
        format.json { render json: { errors: ['Not Authenticated'] }, status: :unauthorized }
      end
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
    if disabled_for_maintenance?
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

  def disabled_for_maintenance?
    ENV["DISABLE_SITE_FOR_MAINTENANCE"] == "1" || get_app_config(AppConfig::DISABLE_SITE_FOR_MAINTENANCE) == "1"
  end

  protected

  def assert_access
    # Actions which don't require access control check
    @access_checked = true
  end

  def check_access
    raise "action doesn't check against access control" unless @access_checked
  end

  def get_background_id(sample, background_id = nil, share_id = nil)
    background_id = (background_id || params[:background_id]).to_i
    if background_id == 0
      return nil
    else
      if share_id
        snapshot = SnapshotLink.find_by(share_id: share_id)
        viewable_background_ids = snapshot ? snapshot.fetch_snapshot_backgrounds.pluck(:id) : []
      else
        viewable_background_ids = current_power.backgrounds.pluck(:id)
      end
      if viewable_background_ids.include?(background_id)
        return background_id
      end
    end

    sample.default_background_id
  end

  # This method is only used to login users using tokens
  # These tokens are issued via the CLI authentication flow
  # It is not intended to replace the authenticate_user! method, which
  # must be invoked regardless.
  # authenticate_user! is used for verifying if the user is already logged in
  # and redirecting to the homepage in case they are not.
  def token_based_login_support
    if request.headers['Authorization'].present?
      @auth0_cli_auth = true
      bearer_token = request.headers['Authorization'].split(' ').last
      authorized = auth0_authenticate_with_bearer_token({ "id_token" => bearer_token })
      @token_based_login_request = authorized
    end
  end

  private

  def set_raven_context
    Raven.user_context(id: current_user.id, admin: current_user.admin?) if current_user
    Raven.extra_context(params: params.to_unsafe_h, url: request.url)
  end

  def check_browser
    browser = UserAgent.parse(request.user_agent).browser
    @browser_info = {
      browser: browser,
      supported: browser != "Internet Explorer",
    }
  end

  # Disabled by default. Add param ?pp=enable to enable or ?pp=disable to disable for your session.
  # See https://github.com/chanzuckerberg/czid-web-private/wiki/%5BDev%5D-Profiling-and-performance-optimization
  def check_rack_mini_profiler
    if current_user && current_user.admin?
      Rack::MiniProfiler.authorize_request
    end
  end

  def set_application_view_variables
    @disable_header_navigation = false
    @auto_account_creation_enabled = get_app_config(AppConfig::AUTO_ACCOUNT_CREATION_V1) == "1"
    @announcement_banner_enabled = announcement_banner_enabled
    @emergency_banner_message = get_app_config(AppConfig::SHOW_EMERGENCY_BANNER_MESSAGE)
  end

  # Set current user and request to global for use in logging in ActiveRecord.
  # See https://stackoverflow.com/a/11670283/200312
  def set_current_context_for_logging!
    ApplicationRecord._current_user = current_user if current_user
    ApplicationRecord._current_request = request if request
  rescue StandardError => e
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

  # This should wrap a code block whose output should be cached.
  # If caching is enabled, attempts to fetch the cached response corresponding to the
  # given cache_key and fills out custom response headers.
  # If the attempt results in a cache miss, then the response is generated normally and
  # will be stored in the cache.
  def fetch_from_or_store_in_cache(skip_cache, cache_key, httpdate)
    if skip_cache
      yield
    else
      # This allows 304 Not Modified to be returned so that the client can use its
      # local cache and avoid the large download.
      response.headers["Last-Modified"] = httpdate
      # This is a custom header for testing and debugging
      response.headers["X-IDseq-Cache"] = 'requested'
      response.headers["X-IDseq-Cache-Key"] = cache_key
      Rails.logger.info("Requesting #{cache_key}")

      Rails.cache.fetch(cache_key, expires_in: 30.days) do
        response.headers["X-IDseq-Cache"] = 'missed'
        yield
      end
    end
  end

  def announcement_banner_enabled
    # Enabled if the flag is enabled AND it's in the active time range.
    if get_app_config(AppConfig::SHOW_ANNOUNCEMENT_BANNER) == "1"
      time_zone = ActiveSupport::TimeZone.new("Pacific Time (US & Canada)")
      now = time_zone.now
      # This is for the Low-Support mode banner in LandingHeaderV2.tsx.
      start_time = time_zone.parse("2024-05-01 08:00:00")
      end_time = time_zone.parse("2025-08-01 09:00:00")

      if start_time < now && now < end_time
        return true
      end
    end

    false
  end
end
