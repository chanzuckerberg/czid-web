class LogAnalyticsEvent
  @queue = :q03_pipeline_run
  def self.perform(key)
    Rails.logger.error("HELLO WORLD 3:39pm")

    Rails.logger.error("ENV: #{ENV['SEGMENT_RUBY_ID']}")
    Resque.logger.error("I'm in perform")

    agent = Segment::Analytics.new(
      write_key: key,
      on_error: proc { |_status, msg| Rails.logger.error(msg) }
    )

    agent.track(event: "foobar 3:29pm", user_id: 1)

    Rails.logger.error("after")

    # MetricUtil.log_analytics_event("foobar 3:10pm", 1)
  end
end
