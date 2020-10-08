require 'resque/server'

Resque.redis = Redis.new(url: REDISCLOUD_URL)

Dir[Rails.root.join('app', 'jobs', '*.rb')].sort.each { |file| require file }

RESQUE_SERVER = Resque::Server.new
# Hide verbose exception pages
RESQUE_SERVER.settings.show_exceptions = false
