require 'resque-scheduler'
# require 'airbrake/resque'

# Resque::Failure.backend = Resque::Failure::Airbrake

Resque.redis = Redis.new(url: REDISCLOUD_URL)

Dir[Rails.root.join('app', 'jobs', '*.rb')].each { |file| require file }
Resque.schedule = YAML.load_file(Rails.root.join('config', 'resque_schedule.yml'))
