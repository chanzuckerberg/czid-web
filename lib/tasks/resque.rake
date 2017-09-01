require 'resque/tasks'
task 'resque:setup' => :environment do
  ENV['QUEUE'] ||= '*'
  Resque.before_fork = proc { ActiveRecord::Base.establish_connection }
end
