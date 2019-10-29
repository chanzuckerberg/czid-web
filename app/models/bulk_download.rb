require 'shellwords'

class BulkDownload < ApplicationRecord
  include Rails.application.routes.url_helpers
  has_and_belongs_to_many :pipeline_runs
  belongs_to :user
  has_secure_token :access_token

  STATUS_WAITING = "waiting".freeze
  STATUS_RUNNING = "running".freeze
  STATUS_ERROR = "error".freeze
  STATUS_SUCCESS = "success".freeze
  OUTPUT_DOWNLOAD_EXPIRATION = 86_400 # seconds

  before_save :convert_params_to_json

  attr_accessor :params

  validates :status, presence: true, inclusion: { in: [STATUS_WAITING, STATUS_RUNNING, STATUS_ERROR, STATUS_SUCCESS] }

  def convert_params_to_json
    # We need the params in object form during validation.
    # Convert params to JSON right before saving.
    if params
      self.params_json = params.to_json
    end
  end

  # Only bulk downloads created by the user
  def self.viewable(user)
    user.bulk_downloads
  end

  def validate_access_token(access_token)
    return self.access_token == access_token
  end

  def output_file_presigned_url
    begin
      return S3_PRESIGNER.presigned_url(:get_object,
                                        bucket: ENV['SAMPLES_BUCKET_NAME'],
                                        key: download_output_key,
                                        expires_in: OUTPUT_DOWNLOAD_EXPIRATION).to_s
    rescue StandardError => e
      LogUtil.log_err_and_airbrake("BulkDownloadPresignError: #{e.inspect}")
    end
    nil
  end

  def server_host
    if Rails.env == "prod"
      "https://idseq.net"
    elsif Rails.env == "staging"
      "https://staging.idseq.net"
    else
      # You can use a tool like ngrok to test bulk downloads locally.
      # DEVELOPMENT_TUNNEL_URL=https://abcdef.ngrok.io docker-compose up web.
      ENV["DEVELOPMENT_TUNNEL_URL"]
    end
  end

  # The Rails success url that the s3_tar_writer task can ping once it succeeds.
  def success_url
    return nil if server_host.blank?
    "#{server_host}#{bulk_downloads_success_path(access_token: access_token, id: id)}"
  end

  # The Rails error url that the s3_tar_writer task can ping if it fails.
  def error_url
    return nil if server_host.blank?
    "#{server_host}#{bulk_downloads_error_path(access_token: access_token, id: id)}"
  end

  # The Rails progress url that the s3_tar_writer task can ping to update progress.
  def progress_url
    return nil if server_host.blank?
    "#{server_host}#{bulk_downloads_progress_path(access_token: access_token, id: id)}"
  end

  def aegea_ecs_submit_command(
    shell_command,
    task_role: "idseq-downloads-#{Rails.env}",
    ecr_image: "idseq-s3-tar-writer:latest",
    fargate_cpu: 4096,
    fargate_memory: 8192
  )
    command = "aegea ecs run --command=#{Shellwords.escape(shell_command)} "
    command += "--task-role #{Shellwords.escape(task_role)} "
    command += "--ecr-image #{Shellwords.escape(ecr_image)} "
    command += "--fargate-cpu #{fargate_cpu} "
    command += "--fargate-memory #{fargate_memory}"
    command
  end

  def s3_tar_writer_command(
    src_urls,
    tar_names,
    dest_url,
    success_url: self.success_url,
    error_url: self.error_url,
    progress_url: self.progress_url
  )
    command = "python s3_tar_writer.py "
    escaped_src_urls = src_urls.map { |url| Shellwords.escape(url) }.join(' ')
    command += "--src-urls #{escaped_src_urls} "
    escaped_tar_names = tar_names.map { |url| Shellwords.escape(url) }.join(' ')
    command += "--tar-names #{escaped_tar_names} "
    command += "--dest-url #{Shellwords.escape(dest_url)} "

    # The success url is mandatory.
    if success_url
      command += "--success-url #{Shellwords.escape(success_url)} "
    elsif Rails.env == "staging" || Rails.env == "prod"
      raise BulkDownloadsHelper::SUCCESS_URL_REQUIRED
    else
      raise BulkDownloadsHelper::SUCCESS_URL_REQUIRED_LOCAL
    end
    if error_url
      command += "--error-url #{Shellwords.escape(error_url)} "
    end
    if progress_url
      command += "--progress-url #{Shellwords.escape(progress_url)}"
    end
    command
  end

  def download_output_key
    "downloads/#{id}/#{download_type}.tar.gz"
  end

  # The s3 url that the tar.gz file will be uploaded to.
  def download_output_url
    "s3://#{ENV['SAMPLES_BUCKET_NAME']}/#{download_output_key}"
  end

  def kickoff_ecs_task(
    shell_command
  )
    aegea_command = aegea_ecs_submit_command(shell_command)

    command_stdout, command_stderr, status = Open3.capture3(aegea_command)
    if status.exitstatus.zero?
      output = JSON.parse(command_stdout)
      # Store the taskArn for debugging purposes.
      self.ecs_task_arn = output['taskArn']
      self.status = STATUS_RUNNING
      save
    else
      self.status = STATUS_ERROR
      self.error_message = BulkDownloadsHelper::KICKOFF_FAILURE
      save
      raise command_stderr
    end
  end

  def bulk_download_ecs_task_command
    if download_type == "original_input_file"
      samples = Sample.where(id: pipeline_runs.map(&:sample_id))
                      .includes(:input_files)

      download_src_urls = samples.map do |sample|
        sample.input_files.map { |input_file| "s3://#{ENV['SAMPLES_BUCKET_NAME']}/#{input_file.file_path}" }
      end.flatten

      # We use the sample name in the input name because it's what is visible to the user.
      # Also, there might be duplicates in the original file name.
      download_tar_names = samples.map do |sample|
        # We assume that the first input file is R1 and the second input file is R2.
        sample.input_files.map.with_index do |input_file, input_file_index|
          "#{input_file.sample.name}__original_R#{input_file_index + 1}.#{input_file.file_type}"
        end
      end.flatten

      return s3_tar_writer_command(
        download_src_urls,
        download_tar_names,
        download_output_url
      )
    end

    return nil
  end

  def kickoff
    ecs_task_command = bulk_download_ecs_task_command
    unless ecs_task_command.nil?
      kickoff_ecs_task(ecs_task_command)
    end
  end
end
