module StringUtil
  # Humanize step name and remove "_out", "Run", and " Out"
  # e.g. "validate_input_out" -> "Validate Input", "runValidateInput" -> "Validate Input"
  def self.humanize_step_name(step_name, stage_name = nil)
    # Support custom pipeline step names (e.g. "RunStar" becomes "STAR" instead of "Star")
    unless stage_name.nil?
      stage_contains_custom_step_names = PipelineRunsHelper::STEP_DESCRIPTIONS&.[](stage_name)&.key?("step_names")
      if stage_contains_custom_step_names
        dag_name = SfnPipelineDataService::SFN_STEP_TO_DAG_STEP_NAME[stage_name][step_name]
        custom_step_names = PipelineRunsHelper::STEP_DESCRIPTIONS[stage_name]["step_names"]
        if custom_step_names.key?(dag_name)
          return custom_step_names[dag_name]
        end
      end
    end

    # Otherwise, infer name with regex (^=matches string start, $=matches string end)
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

  def self.extract_version_string(client_input_string)
    return client_input_string.split("").take_while { |char| char != "-" }.join
  end

  def self.integer?(str)
    str.to_i.to_s == str.to_s
  end
end
