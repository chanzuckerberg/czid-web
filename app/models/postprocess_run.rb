require 'open3'
require 'json'
class PostprocessRun < ApplicationRecord
  belongs_to :pipeline_output
  has_one :sequence_locator

  OUTPUT_FASTA_NAME = 'taxid_annot_sorted.fasta'.freeze
  LOCAL_FASTA_PATH = '/app/tmp/results_fasta'.freeze
  OUTPUT_JSON_NAME = 'taxid_locations.json'.freeze
  LOCAL_JSON_PATH = '/app/tmp/results_json'.freeze
  STATUS_CHECKED = 'CHECKED'.freeze
  STATUS_SUCCESS = 'SUCCEEDED'.freeze
  STATUS_FAILED = 'FAILED'.freeze
  STATUS_RUNNING = 'RUNNING'.freeze
  STATUS_ERROR = 'ERROR'.freeze # when aegea batch describe failed
  STATUS_LOADED = 'LOADED'.freeze

  before_save :check_job_status

  def self.in_progress
    where("job_status != '#{STATUS_FAILED}' OR job_status IS NULL")
      .where(sequence_locator_id: nil)
  end

  def check_job_status
    return if sequence_locator
    if job_status == STATUS_SUCCESS
      self.job_status = STATUS_CHECKED
      Resque.enqueue(LoadPostprocessResultsFromS3, id)
    elsif job_status == STATUS_RUNNING && created_at < 24.hours.ago
      # Try loading the data into DB after 24 hours running the job
      Resque.enqueue(LoadPostprocessResultsFromS3, id)
    end
  end

  def completed?
    return true if sequence_locator || job_status == STATUS_FAILED
  end

  def log_url
    return nil unless job_log_id
    "https://us-west-2.console.aws.amazon.com/cloudwatch/home?region=us-west-2" \
      "#logEventViewer:group=/aws/batch/job;stream=#{job_log_id}"
  end

  def update_job_status
    return if completed?
    command = "aegea batch describe #{job_id}"
    stdout, stderr, status = Open3.capture3(command)
    if status.exitstatus.zero?
      self.job_description = stdout
      job_hash = JSON.parse(job_description)
      self.job_status = job_hash['status']
      if job_hash['container'] && job_hash['container']['logStreamName']
        self.job_log_id = job_hash['container']['logStreamName']
      end
    else
      Airbrake.notify("Error for update job status for postprocessing run #{id} with error #{stderr}")
      self.job_status = STATUS_ERROR
    end
    save
  end

  def local_json_path
    "#{LOCAL_JSON_PATH}/#{id}"
  end

  def load_results_from_s3
    return if sequence_locator
    output_json_s3_path = "#{sample.sample_output_s3_path}/#{OUTPUT_JSON_NAME}"
    # Get the file
    downloaded_json_path = download_file(output_json_s3_path)
    return unless downloaded_json_path
    json_dict = JSON.parse(File.read(downloaded_json_path))
    sl = SequenceLocator.new(json_dict)
    sl.pipeline_output = pipeline_output
    sl.postprocess_run = self
    sl.save

    self.sequence_locator_id = sl.id
    save
    # rm the json
    _stdout, _stderr, _status = Open3.capture3("rm -f #{downloaded_json_path}")
  end
end
