require 'aws-sdk-s3'
require 'active_support/core_ext/object/to_query.rb'

# Modified S3 pre signer class that can inject query params to the URL
#
# Usage example:
#
#    bucket_name = "idseq-samples-staging"
#    key = "samples/123/456/results/stats.json"
#    filename = "my_test.json"
#    duration = 3600
#
#    params = {
#      bucket: bucket_name,
#      key: key,
#      response_content_disposition: "attachment; filename=#{filename}",
#      expires_in: duration
#    }
#
#    signer = S3PreSignerWithQueryParams.new({'x-user-id': 1234, 'x-user-role': 0})
#    url = signer.presigned_url(:get_object, params)
#
#    puts "url = #{url}"
#
class S3PreSignerWithQueryParams < Aws::S3::Presigner
  def initialize(query_params = {}, options = {})
    @query_params = query_params
    super(options)
  end

  def build_signer(cfg)
    signer = super(cfg)
    my_params = @query_params.to_h.to_query()
    signer.define_singleton_method(:presign_url,
                                   lambda do |options|
                                     options[:url].query += "&" + my_params
                                     super(options)
                                   end)
    signer
  end
end
