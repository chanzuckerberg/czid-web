require 'aws-sdk-s3'

class InputFile < ApplicationRecord
  belongs_to :sample

  before_validation(on: :create) do
    Rails.logger.debug('XXX')
    # TODO investigate the content-md5 stuff https://github.com/aws/aws-sdk-js/issues/151 https://gist.github.com/algorist/385616
    signer = Aws::S3::Presigner.new
    self.presigned_url = signer.presigned_url(:put_object, bucket: "czbiohub-infra", key: "tmp.txt")
  end
end
