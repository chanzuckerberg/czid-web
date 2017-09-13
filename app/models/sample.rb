require 'open3'
require 'json'
class Sample < ApplicationRecord
  belongs_to :project
  has_many :pipeline_outputs, dependent: :destroy
  has_many :pipeline_runs, dependent: :destroy
  has_and_belongs_to_many :backgrounds

  def sample_input_s3_path
    # placeholder
    's3://czbiohub-infectious-disease/RR003/RR003-RNA-05_D10_S10'
  end

  def sample_output_s3_path
    # placeholder
    's3://yunfang-workdir/id-rr003/RR003-RNA-05_D10_S10'
  end

  def kickoff_pipeline(dry_run=true) # should be triggered when the upload is complete
    command = IdSeqPipeline.pipeline_command(self.sample_input_s3_path,
                                             self.sample_output_s3_path,
                                             self.id)
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
