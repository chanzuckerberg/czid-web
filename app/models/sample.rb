require 'open3'
require 'json'
class Sample < ApplicationRecord
  belongs_to :project
  has_many :pipeline_outputs, dependent: :destroy
  has_many :pipeline_runs, dependent: :destroy
  has_and_belongs_to_many :backgrounds
  has_many :input_files, dependent: :destroy
  accepts_nested_attributes_for :input_files

  validates_associated :input_files

  # TODO: validate that we have exactly 2 input files
  # TODO validate that both input files have the same source_type
  # TODO for s3 input types, test permissions before saving, by making a HEAD request

  def sample_input_s3_path
    # placeholder
    's3://czbiohub-infectious-disease/RR003/RR003-RNA-05_D10_S10'
  end

  def sample_output_s3_path
    # placeholder
    's3://yunfang-workdir/id-rr003/RR003-RNA-05_D10_S10'
  end

  def pipeline_command
    script_name = File.basename(IdSeqPipeline::S3_SCRIPT_LOC)
    batch_command = "aws s3 cp #{IdSeqPipeline::S3_SCRIPT_LOC} .; chmod 755 #{script_name}; " \
      "INPUT_BUCKET=#{sample_input_s3_path} " \
      "OUTPUT_BUCKET=#{sample_output_s3_path} " \
      "DB_SAMPLE_ID=#{id} ./#{script_name}"
      command = IdSeqPipeline::BASE_COMMAND
    command += "aegea batch submit --command=\"#{batch_command}\" "
    command += " --storage /mnt=1500 --ecr-image idseq --memory 64000"
    command
  end

  def kickoff_pipeline(dry_run = true) # should be triggered when the upload is complete
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
