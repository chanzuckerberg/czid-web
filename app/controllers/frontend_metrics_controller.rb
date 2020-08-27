require './lib/cloudwatch_util'

class FrontendMetricsController < ApplicationController
  include ErrorHelper

  skip_before_action :verify_authenticity_token, only: :create

  class InvalidParametersError < StandardError
    def initialize(invalid_params)
      super("Provided invalid parameters #{invalid_params}")
    end
  end

  def create
    frontend_metrics_params = metric_params.to_h.symbolize_keys
    if metric_params_valid?(frontend_metrics_params)
      metric_datum = prepare_metric_datum(frontend_metrics_params)
      CloudWatchUtil.put_metric_data("#{Rails.env}-frontend", [metric_datum])
    end
  rescue InvalidParametersError => err
    render json: { error: err.message }, status: :bad_request
  rescue ActionController::RoutingError
    render json: { error: FrontendMetricErrors.invalid_route(metric_params[:url], metric_params[:http_method]) }, status: :bad_request
  end

  private

  # In the future, switch to params.permit(metrics: {}, dimensions: {}, method) to generalize and allow creating of multiple metrics and dimensions
  # For now, permitting the url, response_time, and method will suffice
  def metric_params
    params.permit(:url, :response_time, :http_method, :http_status)
  end

  def metric_params_valid?(metric_params)
    invalid_params = []
    invalid_params << metric_params[:url] if metric_params[:url].blank?
    invalid_params << metric_params[:http_method] if metric_params[:http_method].present? && !Set[:put, :post, :get, :delete].include?(metric_params[:http_method].downcase.to_sym)

    # If conversion to float fails, append to invalid_params
    begin
      Float(metric_params[:response_time])
    rescue
      invalid_params << metric_params[:response_time]
    end

    raise InvalidParametersError, invalid_params unless invalid_params.empty?
    return true
  end

  def prepare_metric_datum(metric_params)
    method_as_sym = metric_params[:http_method].downcase.to_sym
    # returns the route's parameter shell
    param_shell = Rails.application.routes.recognize_path(metric_params[:url], method: method_as_sym)
    canonicalized_url = StringUtil.canonicalize_url(metric_params[:url], method_as_sym)

    metric_dimensions = [
      { name: "URL", value: canonicalized_url },
      { name: "HTTP Request Method", value: metric_params[:http_method].titleize },
      { name: "HTTP Status", value: metric_params[:http_status].to_s },
      { name: "Action Controller", value: param_shell[:controller] },
      { name: "Action", value: param_shell[:action] },
    ]
    metric_dimensions << { name: "Format", value: param_shell[:format] } if param_shell.key?(:format)
    return CloudWatchUtil.create_metric_datum("Response Time", metric_params[:response_time].to_f, "Milliseconds", metric_dimensions)
  end
end
