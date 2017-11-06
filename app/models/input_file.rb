require 'aws-sdk-s3'
require 'open3'
class InputFile < ApplicationRecord
  belongs_to :sample
  SOURCE_TYPE_LOCAL = 'local'.freeze
  SOURCE_TYPE_S3 = 's3'.freeze

  FILE_REGEX = %r{\A[^\s\/]+\.(fastq|fastq.gz|fasta|fasta.gz)\z}
  validates :name, presence: true, format: { with: FILE_REGEX, message: "file must match format '#{FILE_REGEX}'" },
    unless: :optional_input?
  validates :source_type, presence: true, inclusion: { in: %w[local s3] }
  validate :s3_source_check, unless: :optional_input?
  validate :file_type_consistency_check, unless: :optional_input?

  def optional_input?
    # If host filtering is skipped, read2 is optional. If a file name is given, it should nevertheless be validated. 
    # TO DO: less hacky way of determining that we're dealing with read2
    sample.host_genome.name == HostGenome::NO_HOST_NAME && id > sample.input_files.first.id && name == ''
  end

  def file_type_consistency_check
    unless file_type == sample.input_files.first.file_type
    errors.add(:input_files, "file types are not equal")
  end

  def s3_source_check
    source.strip! if source.present?
    if source_type == SOURCE_TYPE_S3
      if source[0..4] != 's3://'
        errors.add(:input_files, "file source doesn't start with s3:// for s3 input")
      end
      unless sample.bulk_mode # skip the check for bulk mode
        command = "aws s3 ls #{source}"
        _stdout, _stderr, status = Open3.capture3(command)
        unless status.exitstatus.zero?
          errors.add(:input_files, "file source #{source} doesn't exist")
        end
      end
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

  def file_type
    FILE_REGEX.match(name)[1]
  end
end
