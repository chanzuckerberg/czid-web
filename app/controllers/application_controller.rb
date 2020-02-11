class ApplicationController < ActionController::Base
  protect_from_forgery with: :exception

  before_action :authenticate_user!
  before_action :check_for_maintenance
  before_action :check_rack_mini_profiler
  before_action :check_browser
  before_action :set_current_context_for_logging!
  before_action :set_application_view_variables

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
        format.html { redirect_to root_path }
        format.json { render json: { errors: ['Not Authenticated'] }, status: :unauthorized }
      end
    when AUTH_TOKEN_EXPIRED
      respond_to do |format|
        # we want to redirect user to auth0 login page in silent mode
        # because the user may still have a valid SSO token in the auth0 session.
        # in this case the sliding session will be refreshed, otherwise user will be
        # required to enter email and password
        format.html { redirect_to root_path }
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

      # secure_compare is used to mitigate timing attacks
      if user && ActiveSupport::SecurityUtils.secure_compare(user.authentication_token, user_token)
        warden.set_user(user, scope: :auth0_user)
        @token_based_login_request = true
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
    @announcement_banner_enabled = announcement_banner_enabled
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

  # This should wrap a code block whose output should be cached.
  # If caching is enabled, attempts to fetch the cached response corresponding to the
  # given cache_key and fills out custom response headers.
  # If the attempt results in a cache miss, then the response is generated normally and
  # will be stored in the cache.
  def fetch_from_or_store_in_cache(skip_cache, cache_key, httpdate, event_name)
    if skip_cache
      yield
    else
      MetricUtil.put_metric_now(event_name + ".cache.requested", 1) unless skip_cache
      # This allows 304 Not Modified to be returned so that the client can use its
      # local cache and avoid the large download.
      response.headers["Last-Modified"] = httpdate
      # This is a custom header for testing and debugging
      response.headers["X-IDseq-Cache"] = 'requested'
      response.headers["X-IDseq-Cache-Key"] = cache_key
      Rails.logger.info("Requesting #{cache_key}")

      Rails.cache.fetch(cache_key, expires_in: 30.days) do
        MetricUtil.put_metric_now(event_name + ".cache.miss", 1)
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
      start_time = time_zone.parse("2019-12-20 18:00:00")
      end_time = time_zone.parse("2019-12-30 9:00:00")

      if start_time < now && now < end_time
        return true
      end
    end

    false
  end
end
