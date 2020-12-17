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
    param_shell = Rails.application.routes.recognize_path(url, method: method).reject { |key, _| key == :format }
    uncanonicalized_keys = Set[:action, :controller]
    param_shell.each { |key, _| param_shell[key] = "X" unless uncanonicalized_keys.include?(key) }
    param_shell[:only_path] = true
    return Rails.application.routes.url_for(param_shell)
  rescue ActionController::RoutingError, ActionController::UnknownHttpMethod => err
    LogUtil.log_error(
      ErrorHelper::FrontendMetricErrors.invalid_route(url, method),
      exception: err,
      url: url,
      method: method
    )
    raise err
  end
end
