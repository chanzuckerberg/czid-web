namespace :db do
  desc "Does the db exist?"
  task :exists do # rubocop:disable Rails/RakeEnvironment
    Rake::Task['db:migrate:status'].invoke
  rescue ActiveRecord::NoDatabaseError
    exit 1
  else
    exit 0
  end
end
