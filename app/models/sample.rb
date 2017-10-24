require 'open3'
require 'json'

class Sample < ApplicationRecord
  self.per_page = 10
  STATUS_CREATED  = 'created'.freeze
  STATUS_UPLOADED = 'uploaded'.freeze
  STATUS_RERUN    = 'need_rerun'.freeze
  STATUS_CHECKED  = 'checked'.freeze # status regarding pipeline kickoff is checked
  STATUS_POSTPROCESS = 'need_postprocess'.freeze
  STATUS_CHECKED_POSTPROCESS = 'checked_postprocess'.freeze
  HIT_FASTA_BASENAME = 'taxids.rapsearch2.filter.deuterostomes.taxids.gsnapl.unmapped.bowtie2.lzw.cdhitdup.priceseqfilter.unmapped.star.fasta'.freeze
  UNIDENTIFIED_FASTA_BASENAME = 'unidentified.fasta'.freeze
  LOG_BASENAME = 'log.txt'.freeze
  DEFAULT_MEMORY = 64_000
  DEFAULT_QUEUE = 'aegea_batch_ondemand'.freeze
  DEFAULT_POSTPROCESS_MEMORY = 8_000
  DEFAULT_POSTPROCESS_QUEUE = 'aegea_batch_ondemand'.freeze

  belongs_to :project
  belongs_to :host_genome, optional: true
  has_many :pipeline_outputs, dependent: :destroy
  has_many :pipeline_runs, -> { order(created_at: :desc) }, dependent: :destroy
  has_and_belongs_to_many :backgrounds
  has_many :input_files, dependent: :destroy
  accepts_nested_attributes_for :input_files
  validate :input_files_checks
  after_create :initiate_input_file_upload

  before_save :check_host_genome, :check_status, :check_postprocess_status

  def sample_path
    File.join('samples', project.id.to_s, id.to_s)
  end

  validates_associated :input_files

  def input_files_checks
    # validate that we have exactly 2 input files
    errors.add(:input_files, "file_size !=2 for sample") unless input_files.size == 2
    # validate that both input files have the same source_type
    if input_files.length == 2
      errors.add(:input_files, "file source type different") unless input_files[0].source_type == input_files[1].source_type
    end
    # TODO: for s3 input types, test permissions before saving, by making a HEAD request
  end

  def initiate_input_file_upload
    return unless input_files.first.source_type == InputFile::SOURCE_TYPE_S3
    Resque.enqueue(InitiateS3Cp, id)
  end

  def initiate_s3_cp
    return unless status == STATUS_CREATED
    fastq1 = input_files[0].source
    fastq2 = input_files[1].source
    command = "aws s3 cp #{fastq1} #{sample_input_s3_path}/;"
    command += "aws s3 cp #{fastq2} #{sample_input_s3_path}/;"
    if s3_preload_result_path.present? && s3_preload_result_path[0..4] == 's3://'
      command += "aws s3 cp #{s3_preload_result_path} #{sample_output_s3_path} --recursive;"
    end
    _stdout, stderr, status = Open3.capture3(command)
    unless status.exitstatus.zero?
      Airbrake.notify("Failed to upload sample #{id} with error #{stderr}")
      raise stderr
    end

    self.status = STATUS_UPLOADED
    save # this triggers pipeline
    command
  end

  def sample_input_s3_path
    "s3://#{SAMPLES_BUCKET_NAME}/#{sample_path}/fastqs"
  end

  def sample_output_s3_path
    "s3://#{SAMPLES_BUCKET_NAME}/#{sample_path}/results"
  end

  def sample_annotated_fasta_url
    "https://s3.console.aws.amazon.com/s3/object/#{SAMPLES_BUCKET_NAME}/#{sample_path}/results/#{HIT_FASTA_BASENAME}"
  end

  def sample_unidentified_fasta_url
    "https://s3.console.aws.amazon.com/s3/object/#{SAMPLES_BUCKET_NAME}/#{sample_path}/results/#{UNIDENTIFIED_FASTA_BASENAME}"
  end

  def sample_output_folder_url
    "https://s3.console.aws.amazon.com/s3/buckets/#{SAMPLES_BUCKET_NAME}/#{sample_path}/results/"
  end

  def sample_input_folder_url
    "https://s3.console.aws.amazon.com/s3/buckets/#{SAMPLES_BUCKET_NAME}/#{sample_path}/fastqs/"
  end

  def host_genome_name
    host_genome.name if host_genome
  end

  def as_json(_options = {})
    super(methods: [:sample_input_folder_url, :sample_output_folder_url, :sample_annotated_fasta_url,
                    :sample_unidentified_fasta_url, :host_genome_name])
  end

  def pipeline_command
    script_name = File.basename(IdSeqPipeline::S3_SCRIPT_LOC)
    batch_command_env_variables = "INPUT_BUCKET=#{sample_input_s3_path} OUTPUT_BUCKET=#{sample_output_s3_path} " \
      "DB_SAMPLE_ID=#{id} SAMPLE_HOST=#{sample_host} SAMPLE_LOCATION=#{sample_location} " \
      "SAMPLE_DATE=#{sample_date} SAMPLE_TISSUE=#{sample_tissue} SAMPLE_TEMPLATE=#{sample_template} " \
      "SAMPLE_LIBRARY=#{sample_library} SAMPLE_SEQUENCER=#{sample_sequencer} SAMPLE_NOTES=#{sample_notes} "
    if s3_star_index_path.present?
      batch_command_env_variables += "STAR_GENOME=#{s3_star_index_path} " \
    end
    if s3_bowtie2_index_path.present?
      batch_command_env_variables += "BOWTIE2_GENOME=#{s3_bowtie2_index_path} " \
    end
    batch_command = "aws s3 cp #{IdSeqPipeline::S3_SCRIPT_LOC} .; chmod 755 #{script_name}; " +
                    batch_command_env_variables + "./#{script_name}"
    command = "aegea batch submit --command=\"#{batch_command}\" "
    memory = sample_memory.present? ? sample_memory : DEFAULT_MEMORY
    queue =  job_queue.present? ? job_queue : DEFAULT_QUEUE
    command += " --storage /mnt=1500 --ecr-image idseq --memory #{memory} --queue #{queue} --vcpus 16"
    command
  end

  def check_host_genome
    if host_genome.present?
      self.s3_star_index_path = host_genome.s3_star_index_path
      self.s3_bowtie2_index_path = host_genome.s3_bowtie2_index_path
    end
    s3_preload_result_path ||= ''
    s3_preload_result_path.strip!
  end

  def check_status
    return unless [STATUS_UPLOADED, STATUS_RERUN].include?(status)
    self.status = STATUS_CHECKED
    kickoff_pipeline(false)
  end

  def kickoff_pipeline(dry_run = true)
    # only kickoff pipeline when no active pipeline_run running
    return unless pipeline_runs.in_progress.empty?

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
    if status.exitstatus.zero?
      output =  JSON.parse(pr.command_stdout)
      pr.job_id = output['jobId']
    else
      pr.job_status = PipelineRun::STATUS_FAILED
    end
    pr.save
  end

  def check_postprocess_status
    return unless status == STATUS_POSTPROCESS
    self.status = STATUS_CHECKED_POSTPROCESS
    kickoff_postprocess_pipeline(false)
  end

  def postprocess_command
    script_name = File.basename(IdSeqPostprocess::S3_SCRIPT_LOC)
    batch_command_env_variables = "RESULTS_BUCKET=#{sample_input_s3_path} DB_SAMPLE_ID=#{id} "
    batch_command = "aws s3 cp #{IdSeqPostprocese::S3_SCRIPT_LOC} .; chmod 755 #{script_name}; " +
                    batch_command_env_variables + "./#{script_name}"
    command = "aegea batch submit --command=\"#{batch_command}\" "
    memory = DEFAULT_POSTPROCESS_MEMORY
    queue = DEFAULT_POSTPROCESS_QUEUE
    command += " --storage /mnt=1500 --ecr-image idseq --memory #{memory} --queue #{queue} --vcpus 16"
    command
  end

  def kickoff_postprocess_pipeline(dry_run = true)
    # only kickoff pipeline when no active postprocess_run running
    return unless postprocess_runs.in_progress.empty?

    command = postprocess_command
    if dry_run
      Rails.logger.debug(command)
      return command
    end

    stdout, stderr, status = Open3.capture3(command)
    pr = PostprocessRun.new
    pr.sample = self
    pr.command = command
    pr.command_stdout = stdout
    pr.command_error = stderr
    pr.command_status = status.to_s
    if status.exitstatus.zero?
      output = JSON.parse(pr.command_stdout)
      pr.job_id = output['jobId']
    else
      pr.job_status = PostprocessRun::STATUS_FAILED
    end
    pr.save
  end
end
