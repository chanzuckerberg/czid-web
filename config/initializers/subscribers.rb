########################################
# Note to developers:
# To view the structure of the logs and metrics visit: https://go.czi.team/idseq-sli-metrics
##########################################

unless Rails.env.test?
  require_all 'lib/metric_handlers'

  # We were currently unable to find any cached_read.active_support, cached_write.active_support, and cache_fetch_hit.active_support
  # events, but were left in to be able to be able to potentially find hidden cached events later and has low performance impact
  ActiveSupport::Notifications.subscribe("process_action.action_controller", MetricHandlers::ActionControllerMetricHandler.new)
  ActiveSupport::Notifications.subscribe(/resque/, MetricHandlers::ResqueJobMetricHandler.new)
  ActiveSupport::Notifications.subscribe(/snippet/, MetricHandlers::SnippetMetricHandler.new)
  # Commenting out until more context is provided to sql queries
  # ActiveSupport::Notifications.subscribe("sql.active_record", MetricHandlers::SQLMetricHandler.new)
end
