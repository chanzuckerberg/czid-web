require 'resque/server'
require 'resque/scheduler/server' # Enables 'Schedule' tab (/resque/schedule)

Resque.redis = Redis.new(url: REDISCLOUD_URL)

Dir[Rails.root.join('app', 'jobs', '*.rb')].sort.each { |file| require file }

RESQUE_SERVER = Resque::Server.new
# Hide verbose exception pages
RESQUE_SERVER.settings.show_exceptions = false

Resque.schedule = YAML.load_file('config/resque_schedule.yml')
