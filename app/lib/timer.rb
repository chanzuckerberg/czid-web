class Timer
  # Util function to store and report timing information to log and metrics platform.
  # Has support to handle multiple intermediary split times.

  def initialize(prefix, tags = nil)
    @prefix = prefix
    @start_timestamp = Process.clock_gettime(Process::CLOCK_MONOTONIC)
    @splits = []
    @tags = tags || []
  end

  def add_tags(tags)
    @tags += tags
  end

  def split(name)
    timestamp = Process.clock_gettime(Process::CLOCK_MONOTONIC)
    @splits << [name, timestamp]

    if @splits.length > 1
      elapsed = timestamp - (@splits.length > 1 ? @splits[-2][1] : @start_timestamp)
      Rails.logger.debug("Timer[#{name}]: #{elapsed}")
    end
  end

  def publish
    Rails.logger.debug("Timer for #{@prefix}")
    end_timestamp = Process.clock_gettime(Process::CLOCK_MONOTONIC)
    Rails.logger.debug("Timer:Total: #{end_timestamp - @start_timestamp}")
    MetricUtil.put_metric_now("#{@prefix}.timer", end_timestamp - @start_timestamp, tags: @tags)

    previous_timestamp = @start_timestamp
    @splits.each do |name, split_timestamp|
      Rails.logger.debug("Timer:CP[#{@prefix}.#{name}]: #{split_timestamp - previous_timestamp}")
      MetricUtil.put_metric_now("#{@prefix}.timer.splits", split_timestamp - previous_timestamp, tags: @tags + ["split:#{name}"])
      previous_timestamp = split_timestamp
    end

    MetricUtil.put_metric_now("#{@prefix}.timer.splits", end_timestamp - previous_timestamp, tags: @tags + ["split:last"])
  end
end
