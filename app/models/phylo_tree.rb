class PhyloTree < ApplicationRecord
  include PipelineOutputsHelper
  has_and_belongs_to_many :pipeline_runs
  belongs_to :user
  belongs_to :project
  validates :name, presence: true, uniqueness: true

  STATUS_INITIALIZED = 0
  STATUS_READY = 1
  STATUS_FAILED = 2
  STATUS_IN_PROGRESS = 3

  def self.in_progress
    where(status: STATUS_IN_PROGRESS)
  end

  def newick_s3_path
    "#{phylo_tree_output_s3_path}/#{dag_version}/phylo_tree.newick"
  end

  def dag_version_file
    "#{phylo_tree_output_s3_path}/#{PipelineRun::PIPELINE_VERSION_FILE}"
  end

  def monitor_results
    # Retrieve dag version, which is needed to construct the output path:
    PipelineRun.update_pipeline_version(self, :dag_version, dag_version_file)
    return if dag_version.blank?

    # Retrieve output:
    file = Tempfile.new
    _stdout, _stderr, status = Open3.capture3("aws", "s3", "cp", newick_s3_path, file.path.to_s)
    if status.exitstatus.zero?
      file.open
      self.newick = file.read
      self.status = newick.present? ? STATUS_READY : STATUS_FAILED
      save
    end
    file.close
    file.unlink
  end

  def monitor_job(throttle = true)
    # Detect if batch job has failed so we can stop polling for results.
    # Also, populate job_log_id.
    return if throttle && rand >= 0.1 # if throttling, do time-consuming aegea checks only 10% of the time
    job_status, self.job_log_id, _job_hash, self.job_description = PipelineRunStage.job_info(job_id, id)
    if job_status == PipelineRunStage::STATUS_FAILED ||
       (job_status == "SUCCEEDED" && !Open3.capture3("aws", "s3", "ls", newick_s3_path)[2].exitstatus.zero?)
      self.status = STATUS_FAILED
      save
    end
  end

  def upload_taxon_fasta_inputs_and_return_names
    taxon_fasta_files = []
    pipeline_run_ids.each do |pr_id|
      pr = PipelineRun.find(pr_id)
      taxon_name = pr.taxon_counts.find_by(tax_id: taxid).name.gsub(/\W/, '-')
      sample_name = pr.sample.name.downcase.gsub(/\W/, '-')
      taxon_fasta_basename = "#{sample_name}__#{taxon_name}.fasta"

      # Make taxon fasta and upload into phylo_tree_output_s3_path
      fasta_data = get_taxid_fasta_from_pipeline_run(pr, taxid, tax_level, 'NT')
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
    # Get byte ranges for each pipeline run's taxon fasta.
    # We construct taxon_byteranges_hash to have the following format for integration with idseq-dag:
    # { pipeline_run_id_1: [first_byte, last_byte, source_s3_file, destination_name],
    #   pipeline_run_id_2: ... }
    taxon_byteranges = TaxonByterange.where(pipeline_run_id: pipeline_runs.pluck(:id)).where(taxid: taxid).where(hit_type: 'NT')
    taxon_byteranges_hash = {}
    taxon_byteranges.each do |tbr|
      taxon_byteranges_hash[tbr.pipeline_run_id] = [tbr.first_byte, tbr.last_byte]
    end
    # Get sample names to construct a display name for the taxon fasta
    samples = Sample.where(id: pipeline_runs.pluck(:sample_id))
    taxon_fasta_name_by_sample_id = {}
    samples.each do |s|
      taxon_fasta_name_by_sample_id[s.id] = "#{s.name}__#{tax_name}.fasta"
    end
    # Get locations of align_viz files (needed for identifying NCBI accessions matched by the reads in the taxon fasta)
    align_viz_files = {}
    pipeline_runs.each do |pr|
      align_viz_files[pr.id] = pr.alignment_viz_json_s3("nt.species.#{taxid}") # TODO: also support genus level (based on tax_level)
      taxon_byteranges_hash[pr.id] += [pr.s3_paths_for_taxon_byteranges[tax_level][hit_type],
                                       taxon_fasta_name_by_sample_id[pr.sample_id]]
    end
    # Get the alignment config specifying the location of the NCBI reference used in the pipeline run
    alignment_config = pipeline_runs.last.alignment_config # TODO: revisit case where pipeline_runs have different alignment configs
    # Generate DAG
    attribute_dict = {
      phylo_tree_output_s3_path: phylo_tree_output_s3_path,
      taxid: taxid,
      taxon_byteranges: taxon_byteranges_hash,
      align_viz_files: align_viz_files,
      nt_db: alignment_config.s3_nt_db_path,
      nt_loc_db: alignment_config.s3_nt_loc_db_path
    }
    dag_commands = prepare_dag("phylo_tree", attribute_dict)
    # Dispatch command
    base_command = [PipelineRunStage.install_pipeline("charles/trees"),
                    PipelineRunStage.upload_version(dag_version_file),
                    dag_commands].join("; ")
    PipelineRunStage.aegea_batch_submit_command(base_command, nil)
  end

  def phylo_tree_output_s3_path
    "s3://#{SAMPLES_BUCKET_NAME}/phylo_trees/#{id}"
  end

  def prepare_dag(dag_name, attribute_dict)
    dag_s3 = "#{phylo_tree_output_s3_path}/#{dag_name}.json"
    dag = DagGenerator.new("app/lib/dags/#{dag_name}.json.erb",
                           project_id,
                           nil,
                           nil,
                           attribute_dict)
    self.dag_json = dag.render
    PipelineRunStage.upload_dag_json_and_return_job_command(dag_json, dag_s3, dag_name)
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

  def self.viewable(user)
    if user.admin?
      all
    else
      # user can see tree iff user can see all pipeline_runs
      viewable_pipeline_run_ids = PipelineRun.viewable(user).pluck(:id)
      where("id not in (select phylo_tree_id
                        from phylo_trees_pipeline_runs
                        where pipeline_run_id not in (#{viewable_pipeline_run_ids.join(',')}))")
    end
  end

  def self.editable(user)
    if user.admin?
      all
    else
      # user can edit tree iff user can see tree and user can edit project
      editable_project_ids = Project.editable(user).pluck(:id)
      viewable(user).where("project_id in (?)", editable_project_ids)
    end
  end
end
