module CloudWatchUtil
  # metric_name: String, value: Float, unit: String, dimensions: [Hash<name: String, value: String>]
  def self.create_metric_datum(metric_name, value, unit, dimensions)
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
    AwsClient[:CloudWatch].put_metric_data(namespace: namespace,
                                           metric_data: metric_data)
  end
end
