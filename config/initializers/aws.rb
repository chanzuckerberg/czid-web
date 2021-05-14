module AwsClient
  # Module with lazy initialization of shared AWS clients

  class UnknownClientError < StandardError
    def initialize(key)
      super("Unknown client: #{key}")
    end
  end

  # Local dev option, not officially supported:
  stub_responses = false
  if ENV["OFFLINE"] == "1" || ENV["RAILS_ENV"] == "test"
    stub_responses = true
    credentials = Aws::Credentials.new("fake_access_key_id", "fake_secret_access_key")
    Aws.config.update({ credentials: credentials })
  end

  CLIENT_INITIALIZERS = {
    s3: -> { Aws::S3::Client.new(stub_responses: stub_responses) },
    states: lambda {
      Aws::States::Client.new(
        # Default retry_limit is 3. Default retry_base_delay is 0.3 sec.
        # Default retry_backoff is 2**retries * retry_base_delay.
        # See: https://docs.aws.amazon.com/sdk-for-ruby/v3/api/Aws/States/Client.html
        retry_limit: 6,
        stub_responses: stub_responses
      )
    },
    sts: -> { Aws::STS::Client.new(stub_responses: stub_responses) },
    cloudwatch: -> { Aws::CloudWatch::Client.new(stub_responses: stub_responses) },
  }.freeze

  @clients = {}

  def self.[](key)
    @clients[key] ||= CLIENT_INITIALIZERS[key].call
    @clients[key]
  rescue StandardError
    raise UnknownClientError, key
  end
end
