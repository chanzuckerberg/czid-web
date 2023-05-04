namespace :db do
  desc "Does the db exist?"
  task :exists do # rubocop:disable Rails/RakeEnvironment
    Rake::Task['environment'].invoke
    ActiveRecord::Base.connection
  rescue StandardError
    exit 1
  else
    exit 0
  end
end
