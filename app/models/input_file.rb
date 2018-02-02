require 'aws-sdk-s3'
require 'open3'
class InputFile < ApplicationRecord
  belongs_to :sample
  SOURCE_TYPE_LOCAL = 'local'.freeze
  SOURCE_TYPE_S3 = 's3'.freeze

  FILE_REGEX = %r{\A[^\s\/]+\.(fastq|fq|fastq.gz|fq.gz|fasta|fa|fasta.gz|fa.gz)\z}
  validates :name, presence: true, format: { with: FILE_REGEX, message: "file must match format '#{FILE_REGEX}'" }
  validates :source_type, presence: true, inclusion: { in: %w[local s3] }
  validate :s3_source_check, on: :create

  def s3_source_check
    source.strip! if source.present?
    if source_type == SOURCE_TYPE_S3
      if source[0..4] != 's3://'
        errors.add(:input_files, "file source doesn't start with s3:// for s3 input")
      end
      unless sample.bulk_mode # skip the check for bulk mode
        _stdout, _stderr, status = Open3.capture3("aws", "s3", "ls", source.to_s)
        unless status.exitstatus.zero?
          errors.add(:input_files, "file source #{source} doesn't exist")
        end
      end
    end
  end

  def file_path
    File.join(sample.sample_input_s3_path, name)
  end

  def file_type
    FILE_REGEX.match(name)[1]
  end
end
