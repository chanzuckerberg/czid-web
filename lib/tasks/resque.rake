require 'resque/tasks'
require 'resque/scheduler/tasks'
require 'resque-scheduler'

task 'resque:setup' => :environment do
  ENV['QUEUE'] ||= '*'
  Resque.before_fork = proc { ActiveRecord::Base.establish_connection }
end
