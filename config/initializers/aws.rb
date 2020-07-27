module AwsClient
  # Module with lazy initialization of shared AWS clients

  class UnknownClientError < StandardError
    def initialize(key)
      super("Unknown client: #{key}")
    end
  end

  CLIENT_INITIALIZERS = {
    s3: -> { Aws::S3::Client.new },
    states: -> { Aws::States::Client.new },
    sts: -> { Aws::STS::Client.new },
  }.freeze

  @clients = {}

  def self.[](key)
    @clients[key] ||= CLIENT_INITIALIZERS[key].call
    @clients[key]
  rescue
    raise UnknownClientError, key
  end
end
