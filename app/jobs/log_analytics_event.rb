class LogAnalyticsEvent
  @queue = :q03_pipeline_run

  def self.error(_status, msg)
    Rails.logger.error("in here")
    Rails.logger.error(msg)
  end

  def self.perform(key)
    Rails.logger.error("HELLO WORLD 3:43pm")

    Rails.logger.error("ENV: #{ENV['SEGMENT_RUBY_ID']}")
    Resque.logger.error("I'm in perform")

    agent = Segment::Analytics.new(
      write_key: key,
      on_error: method(:error)
    )

    agent.track(event: "foobar 3:29pm", user_id: 1)

    Rails.logger.error("after")

    # MetricUtil.log_analytics_event("foobar 3:10pm", 1)
  end
end
