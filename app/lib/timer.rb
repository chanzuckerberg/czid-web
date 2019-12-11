class Timer
  # Util function to store and report timing information to log and metrics platform.
  # Has support to handle multiple intermediary split times.

  def initialize(prefix, tags: nil)
    @prefix = prefix
    @start_timestamp = Process.clock_gettime(Process::CLOCK_MONOTONIC)
    @splits = []
    @tags = Set.new(tags)
  end

  def add_tags(tags)
    @tags.merge(tags)
  end

  def split(name)
    timestamp = Process.clock_gettime(Process::CLOCK_MONOTONIC)
    @splits << [name, timestamp]
  end

  def publish
    end_timestamp = Process.clock_gettime(Process::CLOCK_MONOTONIC)

    Rails.logger.debug("Timer:Total[#{@prefix}]: #{end_timestamp - @start_timestamp}")
    MetricUtil.put_metric_now("#{@prefix}.timer", end_timestamp - @start_timestamp, @tags.to_a)

    previous_timestamp = @start_timestamp
    @splits.each do |name, split_timestamp|
      diff = split_timestamp - previous_timestamp
      Rails.logger.debug("Timer:Split[#{@prefix}.#{name}]: #{diff}}")
      MetricUtil.put_metric_now("#{@prefix}.timer.splits", diff.round(6), @tags.to_a + ["split:#{name}"])
      previous_timestamp = split_timestamp
    end

    unless @splits.empty?
      MetricUtil.put_metric_now("#{@prefix}.timer.splits", (end_timestamp - previous_timestamp).round(6), @tags.to_a + ["split:last"])
    end
  end

  def results
    results = {}
    end_timestamp = Process.clock_gettime(Process::CLOCK_MONOTONIC)
    results["#{@prefix}.timer"] = end_timestamp - @start_timestamp

    previous_timestamp = @start_timestamp
    @splits.each do |name, split_timestamp|
      diff = split_timestamp - previous_timestamp
      results["#{@prefix}.timer.#{name}"] = diff.round(6)
      previous_timestamp = split_timestamp
    end

    results["#{@prefix}.timer.last"] = (end_timestamp - previous_timestamp).round(6) unless @splits.empty?
    results
  end
end
