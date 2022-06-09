# Mark existing migrations as safe
# rubocop:disable Style/NumericLiterals
StrongMigrations.start_after = 20220513205413
# rubocop:enable Style/NumericLiterals

# Set timeouts for migrations
StrongMigrations.lock_timeout = 10.seconds
StrongMigrations.statement_timeout = 5.hours

# Analyze tables after indexes are added
# Outdated statistics can sometimes hurt performance
StrongMigrations.auto_analyze = true

# Set the version of the production database
# so the right checks are run in development
StrongMigrations.target_version = "5.7.37"

# Add custom checks
# StrongMigrations.add_check do |method, args|
#   if method == :add_index && args[0].to_s == "users"
#     stop! "No more indexes on the users table"
#   end
# end

# Make some operations safe by default
# See https://github.com/ankane/strong_migrations#saf
