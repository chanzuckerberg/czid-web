class AwsUtil
  # This is currently used to generate log urls for admins. We assume deployment in us-west-2 region.
  AWS_REGION = "us-west-2".freeze

  def self.get_cloudwatch_url(log_group, log_stream)
    "https://#{AWS_REGION}.console.aws.amazon.com/cloudwatch/home?region=#{AWS_REGION}" \
      "#logEventViewer:group=#{log_group};stream=#{log_stream}"
  end
end
