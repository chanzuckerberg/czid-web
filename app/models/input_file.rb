require 'aws-sdk-s3'
require 'open3'
class InputFile < ApplicationRecord
  belongs_to :sample
  SOURCE_TYPE_LOCAL = 'local'.freeze
  SOURCE_TYPE_S3 = 's3'.freeze

  FILE_REGEX = %r{\A[^\s\/]+\.fastq.gz}
  validates :name, presence: true, format: { with: FILE_REGEX, message: "file must match format '#{FILE_REGEX}'" }
  validates :source_type, presence: true, inclusion: { in: %w[local s3] }
  validate :s3_source_check

  def s3_source_check
    source.strip! if source.present?
    if source_type == SOURCE_TYPE_S3 && source[0..4] != 's3://'
      errors.add(:input_files, "file source doesn't start with s3:// for s3 input")
    end
    command = "aws s3 ls #{source}"
    _stdout, _stderr, status = Open3.capture3(command)
    unless status.exitstatus.zero?
      errors.add(:input_files, "file source #{source} doesn't exist")
    end

  end

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
