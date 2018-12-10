require 'open3'

module PipelineRunsHelper
  STEP_DESCRIPTIONS = {
    PipelineRunStage::HOST_FILTERING_STAGE_NAME => {
      "stage" => "Filter out host reads and conduct quality control.",
      "steps" => {
        "star_out" => "Remove host reads using STAR.",
        "trimmomatic_out" => "Trim Illumina adapters using trimmomatic.",
        "priceseq_out" => "Remove low-quality reads using PriceSeqFilter.",
        "cdhitdup_out" => "Remove duplicate reads using CD-HIT-DUP.",
        "lzw_out" => "Remove low-complexity reads using LZW compression filter.",
        "bowtie2_out" => "Remove remaining host reads using Bowtie2.",
        "subsampled_out" => "Subsample if there are too many remaining reads.",
        "gsnap_filter_out" => "Remove remaining host reads using GSNAP."
      }
    },
    PipelineRunStage::ALIGNMENT_STAGE_NAME => {
      "stage" => "Align reads to NCBI nucleotide and protein databases.",
      "steps" => {
        "gsnap_out" => "Align remaining reads to the NCBI NT database using GSNAP.",
        "rapsearch2_out" => "Align remaining reads to the NCBI NR database using RAPSearch2.",
        "taxon_count_out" => "Count preliminary taxon hits.",
        "annotated_out" => "Annotate non-host FASTA with preliminary NCBI accession IDs."
      }
    },
    PipelineRunStage::POSTPROCESS_STAGE_NAME => {
      "stage" => "Assemble reads and refine read assignments.",
      "steps" => {
        "taxid_fasta_out" => "Annotate non-host FASTA with preliminary Taxonomy IDs.",
        "taxid_locator_out" => "Sort preliminary annotated FASTA by Taxonomy IDs and store the byte range of each Taxonomy ID in a JSON.",
        "alignment_viz_out" => "Record number of unique accessions matched.",
        "assembly_out" => "Assemble non-host reads using SPAdes.",
        "coverage_out" => "Calculate converage statistics for assembled contigs",
        "gsnap_accessions_out" => "Generate FASTA of candidate references matched during GSNAP / NT alignment.",
        "rapsearch2_accessions_out" => "Generate FASTA of candidate references matched during RAPSearch2 / NR alignment.",
        "refined_gsnap_out" => "BLAST assembled contigs against candidate references from NT; reassign corresponding reads to the matched taxon.",
        "refined_rapsearch2_out" => "BLAST assembled contigs against candidate references from NR; reassign corresponding reads to the matched taxon.",
        "refined_taxon_count_out" => "Count taxon hits after the reassignment based on the BLAST results.",
        "contig_summary_out" => "Record statistics on the assembled contigs.",
        "refined_annotated_out" => "Annotate non-host FASTA with NCBI accession IDs after the BLAST-based match refinement.",
        "refined_taxid_locator_out" => "Annotate non-host FASTA with revised Taxonomy IDs after the BLAST-based match refinement."
      }
    }
  }.freeze

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
      queue = job_queue
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
    stdout = Syscall.run("aws", "s3", "cp", s3_file, "-")
    return nil if stdout.blank?
    whole_version = stdout.strip
    whole_version =~ /(^\d+\.\d+).*/
    Regexp.last_match(1)
  end

  def upload_dag_json_and_return_job_command(dag_json, dag_s3, dag_name, key_s3_params = nil, copy_done_file = "")
    # Upload dag json
    Syscall.pipe(["echo", dag_json], ["aws", "s3", "cp", "-", dag_s3])

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
