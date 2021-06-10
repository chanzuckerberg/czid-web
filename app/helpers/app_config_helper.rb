module AppConfigHelper
  module_function

  def get_app_config(key, default_value = nil)
    AppConfig.find_by(key: key).presence&.value || default_value
  end

  def set_app_config(key, value)
    app_config = AppConfig.find_by(key: key)

    if app_config.nil?
      app_config = AppConfig.create(key: key)
    end

    app_config.update(value: value)
  end

  def get_json_app_config(key, default_value = nil, raise_error = false)
    value = get_app_config(key)
    begin
      return JSON.parse(value) if value.present? && value.strip != ""
    rescue JSON::ParserError => e
      Rails.logger.error("AppConfigHelper error parsing JSON config key '#{key}'. Error: #{e.message}")
      raise if raise_error
    end
    default_value
  end

  def set_json_app_config(key, value)
    AppConfigHelper.set_app_config(key, JSON.dump(value))
  end

  # Return all app configs that should be sent to the front-end React application.
  def configs_for_context
    # Fetch all app configs in one query.
    app_configs = AppConfig
                  .where(key: [
                           AppConfig::MAX_OBJECTS_BULK_DOWNLOAD,
                           AppConfig::MAX_SAMPLES_BULK_DOWNLOAD_ORIGINAL_FILES,
                         ])
                  .map { |app_config| [app_config.key, app_config.value] }
                  .to_h

    {
      maxObjectsBulkDownload: app_configs[AppConfig::MAX_OBJECTS_BULK_DOWNLOAD].to_i,
      maxSamplesBulkDownloadOriginalFiles: app_configs[AppConfig::MAX_SAMPLES_BULK_DOWNLOAD_ORIGINAL_FILES].to_i,
    }
  end

  def get_workflow_version(workflow_name)
    return get_app_config(format(AppConfig::WORKFLOW_VERSION_TEMPLATE, workflow_name: workflow_name))
  end

  def set_workflow_version(workflow_name, workflow_version)
    key = format(AppConfig::WORKFLOW_VERSION_TEMPLATE, workflow_name: workflow_name)
    Rails.logger.info("WorkflowUpgradeEvent: Setting #{key} to #{workflow_version}")
    return set_app_config(key, workflow_version)
  end
end
