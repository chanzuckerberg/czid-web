require 'resque/tasks'
require 'resque/scheduler/tasks'
task 'resque:setup' => :environment do
  ENV['QUEUE'] ||= '*'
  Resque.before_fork = proc { ActiveRecord::Base.establish_connection }
end

task "resque:scheduler_setup" => :environment do
  ENV['QUEUE'] ||= '*'
end

