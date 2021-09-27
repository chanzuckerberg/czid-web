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

    previous_timestamp = @start_timestamp
    @splits.each do |name, split_timestamp|
      diff = split_timestamp - previous_timestamp
      Rails.logger.debug("Timer:Split[#{@prefix}.#{name}]: #{diff}}")
      previous_timestamp = split_timestamp
    end
  end
end
