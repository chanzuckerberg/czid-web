module AppConfigHelper
  module_function

  def get_app_config(key, default_value = nil)
    # Flags are accessed frequently but don't change that often so we should
    # cache. Value is invalidated by 'after_save :clear_cached_record' but
    # expires_in is set just in case.
    value = Rails.cache.fetch("app_config-#{key}", expires_in: 5.minutes) do
      AppConfig.find_by(key: key).presence&.value
    end
    value || default_value
  end

  def set_app_config(key, value)
    app_config = AppConfig.find_by(key: key)

    if app_config.nil?
      app_config = AppConfig.create(key: key)
    end

    app_config.update(value: value)
  end

  def remove_app_config(key)
    app_config = AppConfig.find_by(key: key)

    if app_config.nil?
      Rails.logger.error("[AppConfigHelper#remove_app_config] could not find key '#{key}'")
    else
      Rails.logger.info("[AppConfigHelper#remove_app_config] removing key '#{key}' with value '#{app_config.value}'")
      app_config.destroy
      Rails.cache.delete("app_config-#{key}")
    end
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
                           AppConfig::AUTO_ACCOUNT_CREATION_V1,
                           AppConfig::MAX_OBJECTS_BULK_DOWNLOAD,
                           AppConfig::MAX_SAMPLES_BULK_DOWNLOAD_ORIGINAL_FILES,
                         ])
                  .map { |app_config| [app_config.key, app_config.value] }
                  .to_h
    {
      autoAccountCreationEnabled: app_configs[AppConfig::AUTO_ACCOUNT_CREATION_V1] == "1",
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
    create_workflow_version(workflow_name, workflow_version)
    return set_app_config(key, workflow_version)
  end

  # TODO: Be able to mark workflows as not runnable/deprecated via the Admin Settings page.
  def create_workflow_version(workflow_name, workflow_version)
    unless WorkflowVersion.find_by(workflow: workflow_name, version: workflow_version)
      WorkflowVersion.create(workflow: workflow_name, version: workflow_version, deprecated: false, runnable: true)
    end
  end
end
