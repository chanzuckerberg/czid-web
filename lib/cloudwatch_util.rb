module CloudWatchUtil
  @cloudwatch_client = Aws::CloudWatch::Client.new

  # metric_name: String, value: Float, unit: String, dimensions: [Hash<name: String, value: String>]
  def self.create_metric_datum(metric_name, value, unit, dimensions = [])
    return {
      metric_name: metric_name,
      dimensions: dimensions,
      timestamp: Time.current,
      value: value,
      unit: unit,
      storage_resolution: 60 # 1 minute resolution
    }
  end

  # namespace: String, metric_data: [metric_datum]
  def self.put_metric_data(namespace, metric_data)
    # TODO: stub and test this
    return if ENV['RAILS_ENV'] == 'test'
    raise ArgumentError, "Namespace is not a String" unless namespace.is_a? String

    @cloudwatch_client.put_metric_data(namespace: namespace,
                                       metric_data: metric_data)
  rescue Aws::CloudWatch::Errors => err
    Rails.logger.error("Metric data #{metric_data} in namespace #{namespace} resulted in #{err.message}")
  rescue ArgumentError => err
    Rails.logger.error(err.message)
  end
end
