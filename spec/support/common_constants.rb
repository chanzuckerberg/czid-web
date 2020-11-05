# Use this module when you want to stub constants that appear
# across the app. This prevents Rails from warning about
# constants declared in multiple locations and helps keep
# code duplication down.

module CommonConstants
  FAKE_SFN_EXECUTION_ARN = "fake:sfn:execution:arn".freeze
end
