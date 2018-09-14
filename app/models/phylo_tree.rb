class PhyloTree < ApplicationRecord
  include PipelineOutputsHelper
  include PipelineRunsHelper
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

  def s3_outputs
    {
      "newick" => "#{versioned_output_s3_path}/phylo_tree.newick",
      "SNP_annotations" => "#{versioned_output_s3_path}/ksnp3_outputs/SNPs_all_annotated"
    }
  end

  def dag_version_file
    "#{phylo_tree_output_s3_path}/#{PipelineRun::PIPELINE_VERSION_FILE}"
  end

  def monitor_results
    # Retrieve dag version, which is needed to construct the output path:
    update_pipeline_version(self, :dag_version, dag_version_file)
    return if dag_version.blank?

    # Retrieve output:
    file = Tempfile.new
    _cmd_stdout, _cmd_stderr, cmd_status = Open3.capture3("aws", "s3", "cp", s3_outputs["newick"], file.path.to_s)
    if cmd_status.success?
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
    job_status, self.job_log_id, _job_hash, self.job_description = job_info(job_id, id)
    if job_status == PipelineRunStage::STATUS_FAILED ||
       (job_status == "SUCCEEDED" && !Open3.capture3("aws", "s3", "ls", newick_s3_path)[2].exitstatus.zero?)
      self.status = STATUS_FAILED
      save
    end
  end

  def job_command
    # Get byte ranges for each pipeline run's taxon fasta.
    # We construct taxon_byteranges_hash to have the following format for integration with idseq-dag:
    # { pipeline_run_id_1: {
    #     'NT': [first_byte, last_byte, source_s3_file, sample_id, align_viz_s3_file],
    #     'NR': [first_byte, last_byte, source_s3_file, sample_id, align_viz_s3_file]
    #   },
    #   pipeline_run_id_2: ... }
    pipeline_run_ids = pipeline_runs.pluck(:id)
    taxon_byteranges = TaxonByterange.where(pipeline_run_id: pipeline_run_ids).where(taxid: taxid)
    taxon_byteranges_hash = {}
    taxon_byteranges.each do |tbr|
      taxon_byteranges_hash[tbr.pipeline_run_id] ||= {}
      taxon_byteranges_hash[tbr.pipeline_run_id][tbr.hit_type] = [tbr.first_byte, tbr.last_byte]
    end
    # If the tree is for genus level or higher, get the top species underneath (these species will have genbank records pulled in idseq-dag)
    if tax_level > TaxonCount::TAX_LEVEL_SPECIES
      level_str = (TaxonCount::LEVEL_2_NAME[tax_level]).to_s
      taxid_column = "#{level_str}_taxid"
      species_counts = TaxonCount.where(pipeline_run_id: pipeline_run_ids).where("#{taxid_column} = ?", taxid).where(tax_level: TaxonCount::TAX_LEVEL_SPECIES)
      species_counts = species_counts.order('pipeline_run_id, count DESC')
      top_taxid_by_run_id = {}
      species_counts.each do |sc|
        top_taxid_by_run_id[sc.pipeline_run_id] ||= sc.tax_id
      end
      reference_taxids = top_taxid_by_run_id.values
    else
      reference_taxids = [taxid]
    end
    # Retrieve superkigdom name for idseq-dag
    superkingdom_name = TaxonLineage.where(taxid: taxid).last.superkingdom_name
    # Get fasta paths and alignment viz paths for each pipeline_run
    align_viz_files = {}
    pipeline_runs.each do |pr|
      level_name = TaxonCount::LEVEL_2_NAME[tax_level] # "species" or "genus"
      align_viz_files[pr.id] = pr.alignment_viz_json_s3("nt.#{level_name}.#{taxid}") # align_viz only exists for NT
      entry = taxon_byteranges_hash[pr.id]
      entry.keys.each do |hit_type|
        entry[hit_type] += [pr.s3_paths_for_taxon_byteranges[tax_level][hit_type]]
      end
    end
    # Get the alignment config specifying the location of the NCBI reference used in the pipeline run
    alignment_config = pipeline_runs.last.alignment_config # TODO: revisit case where pipeline_runs have different alignment configs
    # Generate DAG
    attribute_dict = {
      phylo_tree_output_s3_path: phylo_tree_output_s3_path,
      taxid: taxid,
      reference_taxids: reference_taxids,
      superkingdom_name: superkingdom_name,
      taxon_byteranges: taxon_byteranges_hash,
      align_viz_files: align_viz_files,
      nt_db: alignment_config.s3_nt_db_path,
      nt_loc_db: alignment_config.s3_nt_loc_db_path
    }
    dag_commands = prepare_dag("phylo_tree", attribute_dict)
    # Dispatch command
    base_command = [install_pipeline(dag_branch),
                    upload_version(dag_version_file),
                    dag_commands].join("; ")
    aegea_batch_submit_command(base_command, job_queue: nil)
  end

  def phylo_tree_output_s3_path
    "s3://#{SAMPLES_BUCKET_NAME}/phylo_trees/#{id}"
  end

  def versioned_output_s3_path
    "#{phylo_tree_output_s3_path}/#{dag_version}"
  end

  def prepare_dag(dag_name, attribute_dict)
    dag_s3 = "#{phylo_tree_output_s3_path}/#{dag_name}.json"
    dag = DagGenerator.new("app/lib/dags/#{dag_name}.json.erb",
                           project_id,
                           nil,
                           nil,
                           attribute_dict)
    self.dag_json = dag.render
    upload_dag_json_and_return_job_command(dag_json, dag_s3, dag_name)
  end

  def kickoff
    return unless [STATUS_INITIALIZED, STATUS_FAILED].include?(status)
    self.command_stdout, self.command_stderr, command_status = Open3.capture3(job_command)
    if command_status.exitstatus.zero?
      output = JSON.parse(command_stdout)
      self.job_id = output['jobId']
      self.status = STATUS_IN_PROGRESS
    else
      self.status = STATUS_FAILED
    end
    save
  end

  def self.sample_details_by_tree_id
    query_results = ActiveRecord::Base.connection.select_all("
      select phylo_tree_id, pipeline_run_id, sample_id, samples.*
      from phylo_trees_pipeline_runs, pipeline_runs, samples
      where phylo_trees_pipeline_runs.pipeline_run_id = pipeline_runs.id and
            pipeline_runs.sample_id = samples.id
      order by phylo_tree_id
    ").to_a
    indexed_results = {}
    query_results.each do |entry|
      tree_id = entry["phylo_tree_id"]
      pipeline_run_id = entry["pipeline_run_id"]
      tree_node_name = pipeline_run_id.to_s
      indexed_results[tree_id] ||= {}
      indexed_results[tree_id][tree_node_name] = entry
    end
    indexed_results
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
