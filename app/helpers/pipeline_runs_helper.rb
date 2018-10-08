require 'open3'

module PipelineRunsHelper
  def aegea_batch_submit_command(base_command,
                                 memory: Sample::DEFAULT_MEMORY_IN_MB,
                                 vcpus: Sample::DEFAULT_VCPUS,
                                 job_queue: nil,
                                 docker_image: "idseq_dag")
    command = "aegea batch submit --command=\"#{base_command}\" "
    if memory <= Sample::DEFAULT_MEMORY_IN_MB
      # Use default memory, vCPUs, and queue if below the default memory threshold.
      queue = Sample::DEFAULT_QUEUE
    else
      vcpus = Sample::DEFAULT_VCPUS_HIMEM
      queue = Sample::DEFAULT_QUEUE_HIMEM
    end
    if job_queue.present?
      if Sample::DEPRECATED_QUEUES.include? job_queue
        Rails.logger.info "Overriding deprecated queue #{job_queue} with #{queue}"
      else
        queue = job_queue
      end
    end
    command += " --storage /mnt=#{Sample::DEFAULT_STORAGE_IN_GB} --volume-type gp2 --ecr-image #{docker_image} --memory #{memory} --queue #{queue} --vcpus #{vcpus} --job-role idseq-pipeline "
    command
  end

  def job_info(job_id, run_id)
    job_status = nil
    job_log_id = nil
    job_hash = nil
    stdout, stderr, status = Open3.capture3("aegea", "batch", "describe", job_id.to_s)
    if status.exitstatus.zero?
      job_description = stdout
      job_hash = JSON.parse(job_description)
      job_status = job_hash['status']
      if job_hash['container'] && job_hash['container']['logStreamName']
        job_log_id = job_hash['container']['logStreamName']
      end
    else
      LogUtil.log_err_and_airbrake("Error for update job status for record #{run_id} with error #{stderr}")
      job_status = PipelineRunStage::STATUS_ERROR # transient error, job is still "in progress"
      job_status = PipelineRunStage::STATUS_FAILED if stderr =~ /IndexError/ # job no longer exists
    end
    [job_status, job_log_id, job_hash, stdout]
  end

  def file_generated_since_run(record, s3_path)
    stdout, _stderr, status = Open3.capture3("aws", "s3", "ls", s3_path.to_s)
    return false unless status.exitstatus.zero?
    begin
      s3_file_time = DateTime.strptime(stdout[0..18], "%Y-%m-%d %H:%M:%S")
      return (s3_file_time && record.created_at && s3_file_time > record.created_at)
    rescue
      return nil
    end
  end

  def update_pipeline_version(record, version_column, s3_version_file)
    if record[version_column].blank? && file_generated_since_run(record, s3_version_file)
      record[version_column] = fetch_pipeline_version(s3_version_file)
      record.save
    end
  end

  def fetch_pipeline_version(s3_file = pipeline_version_file)
    whole_version = `aws s3 cp #{s3_file} -`.strip
    whole_version =~ /(^\d+\.\d+).*/
    return Regexp.last_match(1)
  rescue
    return nil
  end

  def upload_dag_json_and_return_job_command(dag_json, dag_s3, dag_name, key_s3_params = nil, copy_done_file = "")
    # Upload dag json
    `echo '#{dag_json}' | aws s3 cp - #{dag_s3}`

    # Generate job command
    dag_path_on_worker = "/mnt/#{dag_name}.json"
    download_dag = "aws s3 cp #{dag_s3} #{dag_path_on_worker}"
    execute_dag = "idseq_dag #{key_s3_params} #{dag_path_on_worker}"
    [download_dag, execute_dag, copy_done_file].join(";")
  end

  def install_pipeline(commit_or_branch)
    "pip install --upgrade git+git://github.com/chanzuckerberg/s3mi.git; " \
    "cd /mnt; " \
    "git clone https://github.com/chanzuckerberg/idseq-dag.git; " \
    "cd idseq-dag; " \
    "git checkout #{commit_or_branch}; " \
    "pip3 install -e . --upgrade"
  end

  def upload_version(s3_file)
    "idseq_dag --version | cut -f2 -d ' ' | aws s3 cp  - #{s3_file}"
  end

  def download_to_filename?(s3_file, local_file)
    # downloads file and returns whether it was successful
    Open3.capture3("aws", "s3", "cp", s3_file, local_file)[2].success?
  end

  def exists_in_s3?(s3_path)
    Open3.capture3("aws", "s3", "ls", s3_path)[2].success?
  end
end
