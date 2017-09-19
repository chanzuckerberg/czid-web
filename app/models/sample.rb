require 'open3'
require 'json'
class Sample < ApplicationRecord
  STATUS_CREATED  = 'created'.freeze
  STATUS_UPLOADED = 'uploaded'.freeze
  STATUS_RERUN    = 'need_rerun'.freeze
  STATUS_CHECKED  = 'checked'.freeze # status regarding pipeline kickoff is checked

  belongs_to :project
  has_many :pipeline_outputs, dependent: :destroy
  has_many :pipeline_runs, dependent: :destroy
  has_and_belongs_to_many :backgrounds
  has_many :input_files, dependent: :destroy
  accepts_nested_attributes_for :input_files
  validate :input_files_checks
  after_create :initiate_input_file_upload
  before_save :check_status

  def sample_path
    File.join('samples', project.id.to_s, id.to_s)
  end

  validates_associated :input_files

  def input_files_checks
    # validate that we have exactly 2 input files
    unless self.input_files.size == 2
      self.errors.add(:input_files, "file_size !=2 for sample")
    end
    # validate that both input files have the same source_type
    unless self.input_files[0].source_type == self.input_files[1].source_type
      self.errors.add(:input_files, "file source type different")
    end
    # TODO for s3 input types, test permissions before saving, by making a HEAD request

  end

  def initiate_input_file_upload
    return unless self.input_files.first.source_type == InputFile::SOURCE_TYPE_S3
    Resque.enqueue(InitiateS3Cp, self.id)
  end

  def initiate_s3_cp
    command = IdSeqPipeline::BASE_COMMAND
    fastq_1 = self.input_files[0].source
    fastq_2 = self.input_files[1].source
    command += "aws s3 cp #{fastq_1} #{sample_input_s3_path}/;"
    command += "aws s3 cp #{fastq_2} #{sample_input_s3_path}/;"
    stdout, stderr, status = Open3.capture3(command)
    raise stderr unless status.exitstatus == 0

    self.status = STATUS_UPLOADED
    self.save # this triggers pipeline
    return command
  end

  def sample_input_s3_path
    "s3://#{SAMPLES_BUCKET_NAME}/#{sample_path}/fastqs"
  end

  def sample_output_s3_path
    "s3://#{SAMPLES_BUCKET_NAME}/#{sample_path}/results"
  end

  def pipeline_command
    script_name = File.basename(IdSeqPipeline::S3_SCRIPT_LOC)
    batch_command = "aws s3 cp #{IdSeqPipeline::S3_SCRIPT_LOC} .; chmod 755 #{script_name}; " \
                    "INPUT_BUCKET=#{sample_input_s3_path} " \
                    "OUTPUT_BUCKET=#{sample_output_s3_path} " \
                    "DB_SAMPLE_ID=#{id} " \
                    "SAMPLE_HOST=#{sample_host} " \
                    "SAMPLE_LOCATION=#{sample_location} " \
                    "SAMPLE_DATE=#{sample_date} " \
                    "SAMPLE_TISSUE=#{sample_tissue} " \
                    "SAMPLE_TEMPLATE=#{sample_template} " \
                    "SAMPLE_LIBRARY=#{sample_library} " \
                    "SAMPLE_SEQUENCER=#{sample_sequencer} " \
                    "SAMPLE_NOTES=#{sample_notes} " \
                    "./#{script_name}"
    command = IdSeqPipeline::BASE_COMMAND
    command += "aegea batch submit --command=\"#{batch_command}\" "
    command += " --storage /mnt=1500 --ecr-image idseq --memory 64000"
    command
  end

  def check_status
    return unless [STATUS_UPLOADED, STATUS_RERUN].include?(status)
    self.status = STATUS_CHECKED
    kickoff_pipeline
  end

  def kickoff_pipeline(dry_run = true)
    command = pipeline_command
    if dry_run
      Rails.logger.debug(command)
      return command
    end

    stdout, stderr, status = Open3.capture3(command)
    pr = PipelineRun.new
    pr.sample = self
    pr.command = command
    pr.command_stdout = stdout
    pr.command_error = stderr
    pr.command_status = status.to_s
    output =  JSON.parse(pr.command_stdout)
    pr.job_id = output['jobId']
    pr.save
  end
end
