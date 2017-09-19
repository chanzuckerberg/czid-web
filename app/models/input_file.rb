require 'aws-sdk-s3'

class InputFile < ApplicationRecord
  belongs_to :sample
  SOURCE_TYPE_LOCAL = 'local'
  SOURCE_TYPE_S3 = 's3'

  FILE_REGEX = %r{\A[^\s\/]+\.fastq.gz}
  validates :name, presence: true, format: { with: FILE_REGEX, message: "file must match format '#{FILE_REGEX}'" }
  validates :source_type, presence: true, inclusion: { in: [SOURCE_TYPE_LOCAL, SOURCE_TYPE_LOCAL] }

  after_validation(on: :create) do
    if sample && source_type == 'local'
      # TODO: investigate the content-md5 stuff https://github.com/aws/aws-sdk-js/issues/151 https://gist.github.com/algorist/385616
      self.presigned_url = S3_PRESIGNER.presigned_url(:put_object, bucket: SAMPLES_BUCKET_NAME, key: file_path)
    end
  end

  def file_path
    File.join(sample.sample_path, 'fastqs', name)
  end
end
