class PhyloTree < ApplicationRecord
  include PipelineOutputsHelper
  has_and_belongs_to_many :pipeline_runs
  belongs_to :user
  belongs_to :project

  STATUS_INITIALIZED = 0
  STATUS_READY = 1
  STATUS_FAILED = 2
  STATUS_IN_PROGRESS = 3

  def self.in_progress
    where(status: STATUS_IN_PROGRESS)
  end

  def monitor_results
    output_s3 = "#{phylo_tree_output_s3_path}/phylo_tree.newick"
    file = Tempfile.new
    _stdout, _stderr, status = Open3.capture3("aws", "s3", "cp", output_s3, file.path.to_s)
    if status.exitstatus.zero?
      file.open
      self.newick = file.read
      self.status = STATUS_READY
      save
    end
    file.close
    file.unlink
  end

  def monitor_job
    # detect if batch job has failed so we can stop pulling for results
    return unless rand < 0.1 # do time-consuming aegea checks everytime
    job_status, self.job_log_id, _job_hash, self.job_description = PipelineRunStage.job_info(job_id, id)
    self.status = STATUS_FAILED if job_status == PipelineRunStage::STATUS_FAILED
    save
  end

  def aegea_command(base_command)
    "aegea batch submit --command=\"#{base_command}\" " \
    " --storage /mnt=#{Sample::DEFAULT_STORAGE_IN_GB} --volume-type gp2 --ecr-image idseq_dag --memory #{Sample::DEFAULT_MEMORY_IN_MB}" \
    " --queue #{Sample::DEFAULT_QUEUE} --vcpus #{Sample::DEFAULT_VCPUS} --job-role idseq-pipeline"
  end

  def upload_taxon_fasta_inputs_and_return_names
    taxon_fasta_files = []
    pipeline_run_ids.each do |pr_id|
      taxon_fasta_basename = "taxid_#{taxid}_pipeline_run_#{pr_id}.fasta"

      # Make taxon fasta and upload into phylo_tree_output_s3_path
      fasta_data = get_taxid_fasta_from_pipeline_run(PipelineRun.find(pr_id), taxid, tax_level, 'NT')
      file = Tempfile.new
      file.write(fasta_data)
      file.close
      _stdout, _stderr, status = Open3.capture3("aws", "s3", "cp", file.path.to_s, "#{phylo_tree_output_s3_path}/#{taxon_fasta_basename}")
      file.unlink
      if status.exitstatus.zero?
        taxon_fasta_files << taxon_fasta_basename
      else
        Airbrake.notify("Failed S3 upload of #{taxon_fasta_basename} for tree #{id}")
      end
    end

    taxon_fasta_files
  end

  def job_command
    taxon_fasta_files = upload_taxon_fasta_inputs_and_return_names
    attribute_dict = {
      phylo_tree_output_s3_path: phylo_tree_output_s3_path,
      taxon_fasta_files: taxon_fasta_files,
      taxid: taxid
    }
    dag_commands = prepare_dag("phylo_tree", attribute_dict)

    install_pipeline = "pip install --upgrade git+git://github.com/chanzuckerberg/s3mi.git; " \
      "cd /mnt; " \
      "git clone https://github.com/chanzuckerberg/idseq-dag.git; " \
      "cd idseq-dag; " \
      "pip3 install -e . --upgrade"

    base_command = [install_pipeline, dag_commands].join("; ")
    aegea_command(base_command)
  end

  def phylo_tree_output_s3_path
    "s3://#{SAMPLES_BUCKET_NAME}/phylo_trees/#{id}"
  end

  def prepare_dag(dag_name, attribute_dict, key_s3_params = nil)
    dag_s3 = "#{phylo_tree_output_s3_path}/#{dag_name}.json"

    dag = DagGenerator.new("app/lib/dags/#{dag_name}.json.erb",
                           project_id,
                           nil,
                           nil,
                           attribute_dict)
    self.dag_json = dag.render

    `echo '#{dag_json}' | aws s3 cp - #{dag_s3}`

    # Generate job command
    dag_path_on_worker = "/mnt/#{dag_name}.json"
    download_dag = "aws s3 cp #{dag_s3} #{dag_path_on_worker}"
    execute_dag = "idseq_dag #{key_s3_params} #{dag_path_on_worker}"
    [download_dag, execute_dag].join(";")
  end

  def kickoff
    return unless [STATUS_INITIALIZED, STATUS_FAILED].include?(status)
    self.command_stdout, self.command_stderr, status = Open3.capture3(job_command)
    if status.exitstatus.zero?
      output = JSON.parse(command_stdout)
      self.job_id = output['jobId']
      self.status = STATUS_IN_PROGRESS
    else
      self.status = STATUS_FAILED
    end
    save
  end
end
