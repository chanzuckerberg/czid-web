require 'aws-sdk-s3'

class InputFile < ApplicationRecord
  belongs_to :sample

  FILE_REGEX = %r{\A[^\s\/]+\.fastq.gz}
  validates :name, presence: true, format: { with: FILE_REGEX, message: "file must match format '#{FILE_REGEX}'" }

  after_validation(on: :create) do
    if sample
      # TODO: investigate the content-md5 stuff https://github.com/aws/aws-sdk-js/issues/151 https://gist.github.com/algorist/385616
      self.presigned_url = S3_PRESIGNER.presigned_url(:put_object, bucket: SAMPLES_BUCKET_NAME, key: file_path)
    end
  end

  def file_path
    File.join('samples', sample.project.id.to_s, sample.id.to_s, name)
  end
end
