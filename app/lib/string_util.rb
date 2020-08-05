module StringUtil
  # Humanize step name and remove "_out", "Run", and " Out"
  # e.g. "validate_input_out" -> "Validate Input"
  # && "runValidateInput" -> "Validate Input"
  # The carat "^" matches the beginning of a string, and
  # the dollar sign "$" the end of a string.
  def self.humanize_step_name(step_name)
    strip_regex = /(^Run )|(_out$)|( Out$)/
    return step_name.split("_").join(" ").titleize.gsub(strip_regex, "")
  end

  # Canonicalizes a given URL that is recognized by our routes
  # i.e. url = `/samples/1/save_metadata_v2` method: POST
  #      canonicalize_url(url, :post) => "/samples/X/save_metadata_v2"
  def self.canonicalize_url(url, method)
    raise ActionController::RoutingError, "The url provided is an empty string" if url.blank?
    # returns the route's parameter shell
    param_shell = Rails.application.routes.recognize_path(url, method: method)
    url_for_args = { controller: param_shell[:controller], action: param_shell[:action], only_path: true }
    url_for_args[:id] = "X" if param_shell.key?(:id)
    return Rails.application.routes.url_for(url_for_args)
  rescue ActionController::RoutingError, ActionController::UnknownHttpMethod => err
    Rails.logger.error(ErrorHelper::FrontendMetricErrors.invalid_route(url, method))
    LogUtil.log_backtrace(err)
    raise err
  end
end
