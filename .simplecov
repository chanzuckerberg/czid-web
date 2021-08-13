SimpleCov.start 'rails' do
  add_group "Services", "app/services"

  enable_coverage :branch

  # Please add tests for new code so that we don't fall below the minimums!
  # To view report after running tests locally, go to 'coverage/index.html'.
  #
  # If needed, you can exclude code by wrapping it in # :nocov:
  # # :nocov:
  # def skip_this_method
  #   never_reached
  # end
  # # :nocov:
  #
  # Line coverage measures % of lines executed.
  # Branch coverage measures % of conditional branches executed.
  minimum_coverage line: 61, branch: 46

  # Exclude mostly manual tasks for now:
  add_filter "/lib/tasks"
end
