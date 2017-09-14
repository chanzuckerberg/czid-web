require 'aws-sdk-s3'

class InputFile < ApplicationRecord
  belongs_to :sample

  before_validation(on: :create) do
    # TODO: investigate the content-md5 stuff https://github.com/aws/aws-sdk-js/issues/151 https://gist.github.com/algorist/385616
    self.presigned_url = S3_PRESIGNER.presigned_url(:put_object, bucket: SAMPLES_BUCKET_NAME, key: file_path)
  end

  def file_path
    File.join('samples', sample.project.name, sample.name, name)
  end
end
