module Analytics
  CONFIG = YAML.load_file(Rails.root.join('config', 'analytics.yml'))[Rails.env]
  TRACKING_SOURCE = CONFIG['tracking_src']
end
