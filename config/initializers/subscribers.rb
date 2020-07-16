########################################
# Note to developers:
# To view the structure of the logs and metrics visit: https://go.czi.team/idseq-sli-metrics
##########################################

if !Rails.env.test? && !Rails.env.production?
  require_all 'lib/subscribers'

  ActiveSupport::Notifications.subscribe("process_action.action_controller", Subscribers::ActionControllerMetricHandler.new)
  ActiveSupport::Notifications.subscribe("sql.active_record", Subscribers::SQLMetricHandler.new)

  # We were currently unable to find any cached_read.active_support, cached_write.active_support, and cache_fetch_hit.active_support
  # events, but were left in to be able to be able to potentially find hidden cached events later and has low performance impact
  ActiveSupport::Notifications.subscribe("cached_read.active_support", Subscribers::CacheReadMetricHandler.new)
  ActiveSupport::Notifications.subscribe("cache_write.active_support", Subscribers::CacheWriteMetricHandler.new)
  ActiveSupport::Notifications.subscribe("cache_fetch_hit.active_support", Subscribers::CacheFetchHitMetricHandler.new)
end
