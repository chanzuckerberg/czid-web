require 'aws-sdk-s3'
require 'open3'

class InputFile < ApplicationRecord
  belongs_to :sample

  FILE_REGEX = /\A[A-Za-z0-9_][-.A-Za-z0-9_\(\)]{0,119}\.(fastq|fq|fastq.gz|fq.gz|fasta|fa|fasta.gz|fa.gz|bed|bed.gz)\z/.freeze

  validates :name, presence: true, format: { with: FILE_REGEX, message: "file must match format '#{FILE_REGEX}'" }

  FILE_TYPE_FASTQ = 'fastq'.freeze
  FILE_TYPE_PRIMER_BED = 'primer_bed'.freeze
  FILE_TYPE_REFERENCE_SEQUENCE = "reference_sequence".freeze
  # Historically, we have allowed fasta input files for short-read-mngs samples.
  # These short-read-mngs input fastas have been backfilled as FILE_TYPE_FASTQ,
  # which means they will be treated as fastq files but will contain a fasta file_extension.
  scope :fastq, -> { where(file_type: FILE_TYPE_FASTQ) }
  scope :primer_bed, -> { where(file_type: FILE_TYPE_PRIMER_BED) }
  scope :reference_sequence, -> { where(file_type: FILE_TYPE_REFERENCE_SEQUENCE) }
  scope :by_type, ->(file_type) { where(file_type: file_type) }

  SOURCE_TYPE_LOCAL = 'local'.freeze
  SOURCE_TYPE_S3 = 's3'.freeze
  SOURCE_TYPE_BASESPACE = 'basespace'.freeze
  validates :source_type, presence: true, inclusion: { in: [
    SOURCE_TYPE_LOCAL,
    SOURCE_TYPE_S3,
    SOURCE_TYPE_BASESPACE,
  ] }

  validates :source, presence: true

  UPLOAD_CLIENT_CLI = 'cli'.freeze
  UPLOAD_CLIENT_INTERNAL = 'internal'.freeze
  UPLOAD_CLIENT_WEB = 'web'.freeze
  validates :upload_client, presence: true, on: :create, inclusion: { in: [
    UPLOAD_CLIENT_CLI,
    UPLOAD_CLIENT_INTERNAL,
    UPLOAD_CLIENT_WEB,
  ] }
  validate :s3_source_check, on: :create

  BULK_FILE_PAIRED_REGEX = /\A([A-Za-z0-9_][-.A-Za-z0-9_]{1,119})_R(\d)(_001)?\.(fastq.gz|fq.gz|fastq|fq|fasta.gz|fa.gz|fasta|fa)\z/.freeze
  BULK_FILE_SINGLE_REGEX = /\A([A-Za-z0-9_][-.A-Za-z0-9_]{1,119})\.(fastq.gz|fq.gz|fastq|fq|fasta.gz|fa.gz|fasta|fa)\z/.freeze

  def s3_source_check
    source.strip! if source.present?
    if source_type == SOURCE_TYPE_S3
      if source[0..4] != 's3://'
        errors.add(:input_files, "source doesn't start with s3:// for s3 input")
      elsif !sample.user.can_upload(source.to_s)
        errors.add(:input_files, "forbidden s3 bucket")
      elsif !sample.bulk_mode # skip the check for bulk mode
        fhead = Syscall.pipe_with_output(["aws", "s3", "cp", source.to_s, "-"], ["head", "-c", "100"])
        errors.add(:input_files, "forbidden file object") if fhead.empty?
      end
    end
  end

  # As of May 2023, this file path will, in addition to storing fastq files,
  # also store reference sequences and primer bed files.
  def file_path
    File.join(sample.sample_path, 'fastqs', name)
  end

  def s3_path
    File.join(sample.sample_input_s3_path, name)
  end

  def multipart_upload_id
    S3Util.latest_multipart_upload(ENV['SAMPLES_BUCKET_NAME'], file_path)
  end

  def file_extension
    FILE_REGEX.match(name)[1] if FILE_REGEX.match(name)
  end

  def s3_presence_check
    S3_CLIENT.head_object(bucket: SAMPLES_BUCKET_NAME, key: file_path)
    true
  rescue Aws::S3::Errors::NotFound
    false
  end
end
