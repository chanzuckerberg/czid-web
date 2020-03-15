namespace "features" do

  # rake features:launch[<feature_name>]
  task :launch, [:feature_name] => :environment do |_, args|
    new_features = AppConfigHelper.get_json_app_config(AppConfig::LAUNCHED_FEATURES, []) | [args[:feature_name]]
    AppConfigHelper.set_json_app_config(AppConfig::LAUNCHED_FEATURES, new_features)
    puts "Add feature: #{args[:feature_name]}"
    puts "Currently launched: #{new_features}"
  end

  # rake features:remove[<feature_name>]
  task :remove, [:feature_name] => :environment do |_, args|
    features = AppConfigHelper.get_json_app_config(AppConfig::LAUNCHED_FEATURES, [])
    if features.include?(args[:feature_name])
      features -= [args[:feature_name]]
      AppConfigHelper.set_json_app_config(AppConfig::LAUNCHED_FEATURES, features)
      puts "Removed feature: #{args[:feature_name]}"
    else
      puts "Feature is not launched: #{args[:feature_name]}"
    end
    puts "Currently launched: #{features}"
  end

  # rake features:list
  task :list => :environment do
    features = AppConfigHelper.get_json_app_config(AppConfig::LAUNCHED_FEATURES, [])
    puts "Currently launched: #{features}"
  end
end
