class AwsUtil
  def self.get_cloudwatch_url(log_group, log_stream)
    "https://us-west-2.console.aws.amazon.com/cloudwatch/home?region=us-west-2" \
      "#logEventViewer:group=#{log_group};stream=#{log_stream}"
  end
end
