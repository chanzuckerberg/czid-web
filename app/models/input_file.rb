require 'aws-sdk-s3'
require 'open3'
class InputFile < ApplicationRecord
  belongs_to :sample
  SOURCE_TYPE_LOCAL = 'local'.freeze
  SOURCE_TYPE_S3 = 's3'.freeze

  FILE_REGEX = %r{\A[^\s\/]+\.(fastq|fq|fastq.gz|fq.gz|fasta|fa|fasta.gz|fa.gz)\z}
  BULK_FILE_PAIRED_REGEX = /([^ ]*)_R(\d)(_001)?.(fastq.gz|fq.gz|fastq|fq|fasta.gz|fa.gz|fasta|fa)\z/
  BULK_FILE_SINGLE_REGEX = /([^ ]*).(fastq.gz|fq.gz|fastq|fq|fasta.gz|fa.gz|fasta|fa)\z/
  validates :name, presence: true, format: { with: FILE_REGEX, message: "file must match format '#{FILE_REGEX}'" }
  validates :source_type, presence: true, inclusion: { in: %w[local s3] }
  validate :s3_source_check, on: :create

  def s3_source_check
    source.strip! if source.present?
    if source_type == SOURCE_TYPE_S3
      if source[0..4] != 's3://'
        errors.add(:input_files, "source doesn't start with s3:// for s3 input")
      elsif !sample.user.can_upload(source.to_s)
        errors.add(:input_files, "forbidden s3 bucket")
      elsif !sample.bulk_mode # skip the check for bulk mode
        fhead = Syscall.pipe(["aws", "s3", "cp", source.to_s, "-"], ["head", "-c", "100"])
        errors.add(:input_files, "forbidden file object") if fhead.empty?
      end
    end
  end

  def file_path
    File.join(sample.sample_path, 'fastqs', name)
  end

  def file_type
    FILE_REGEX.match(name)[1] if FILE_REGEX.match(name)
  end
end
