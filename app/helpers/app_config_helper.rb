module AppConfigHelper
  def get_app_config(key)
    app_config = AppConfig.find_by(key: key)

    return app_config.present? ? app_config.value : nil
  end

  def set_app_config(key, value)
    app_config = AppConfig.find_by(key: key)

    if app_config.nil?
      app_config = AppConfig.create(key: key)
    end

    app_config.update(value: value)
  end
end
