require 'resque-scheduler'
Resque.redis = Redis.new(url: REDISCLOUD_URL)

Dir["#{Rails.root}/app/jobs/*.rb"].each { |file| require file }
Resque.schedule = YAML.load_file(Rails.root.join('config', 'resque_schedule.yml'))
