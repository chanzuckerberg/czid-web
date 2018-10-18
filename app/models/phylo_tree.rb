class PhyloTree < ApplicationRecord
  include PipelineOutputsHelper
  include PipelineRunsHelper
  include ActionView::Helpers::DateHelper
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
      "newick" => {
        "s3_path" => "#{versioned_output_s3_path}/phylo_tree.newick",
        "required" => true,
        "remote" => false
      },
      "ncbi_metadata" => {
        "s3_path" => "#{versioned_output_s3_path}/ncbi_metadata.json",
        "required" => true,
        "remote" => false
      },
      "snp_annotations" => {
        "s3_path" => "#{versioned_output_s3_path}/ksnp3_outputs/SNPs_all_annotated",
        "required" => false,
        "remote" => true
      },
      "vcf" => {
        "s3_path" => "#{versioned_output_s3_path}/ksnp3_outputs/variants_reference1.vcf",
        "required" => false,
        "remote" => true
      }
    }
  end

  def select_outputs(property, value = true)
    s3_outputs.select { |_output, props| props[property] == value }.keys
  end

  def dag_version_file
    "#{phylo_tree_output_s3_path}/#{PipelineRun::PIPELINE_VERSION_FILE}"
  end

  def runtime(human_readable = true)
    seconds = (ready_at || Time.current) - created_at
    human_readable ? distance_of_time_in_words(seconds) : seconds
  end

  def monitor_results
    # Retrieve dag version, which is needed to construct the output path:
    update_pipeline_version(self, :dag_version, dag_version_file)
    return if dag_version.blank?

    # Retrieve outputs to local db:
    local_outputs = select_outputs("remote", false)
    temp_files_by_output = {}
    local_outputs.each do |out|
      temp_files_by_output[out] = Tempfile.new
      download_status = Open3.capture3("aws", "s3", "cp", s3_outputs[out]["s3_path"], temp_files_by_output[out].path.to_s)[2]
      temp_files_by_output[out].open
      self[out] = temp_files_by_output[out].read if download_status.success?
    end

    # Check for remote outputs:
    remote_outputs = select_outputs("remote")
    remote_outputs.each do |out|
      s3_path = s3_outputs[out]["s3_path"]
      self[out] = s3_path if Open3.capture3("aws", "s3", "ls", s3_path)[2].success?
    end

    # Update status:
    required_outputs = select_outputs("required")
    if required_outputs.all? { |ro| self[ro].present? }
      self.status = STATUS_READY
      self.ready_at = Time.current
    end
    save

    # Clean up:
    temp_files_by_output.values.each do |tf|
      tf.close
      tf.unlink
    end
  end

  def monitor_job(throttle = true)
    # Detect if batch job has failed so we can stop polling for results.
    # Also, populate job_log_id.
    return if throttle && rand >= 0.1 # if throttling, do time-consuming aegea checks only 10% of the time
    job_status, self.job_log_id, _job_hash, self.job_description = job_info(job_id, id)
    required_outputs = select_outputs("required")
    if job_status == PipelineRunStage::STATUS_FAILED ||
       (job_status == "SUCCEEDED" && !required_outputs.all? { |ro| exists_in_s3?(s3_outputs[ro]["s3_path"]) })
      self.status = STATUS_FAILED
    end
    save
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
      reference_taxids = top_taxid_by_run_id.values.uniq
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
      newick_basename: File.basename(s3_outputs["newick"]["s3_path"]),
      ncbi_metadata_basename: File.basename(s3_outputs["ncbi_metadata"]["s3_path"]),
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

  def self.users_by_tree_id
    ActiveRecord::Base.connection.select_all("
      select phylo_trees.id as phylo_tree_id, users.id, users.name
      from phylo_trees, users
      where phylo_trees.user_id = users.id
      order by phylo_tree_id
    ").index_by { |entry| entry["phylo_tree_id"] }
  end

  def self.sample_details_by_tree_id
    query_results = ActiveRecord::Base.connection.select_all("
      select phylo_tree_id, pipeline_run_id, ncbi_metadata, sample_id, samples.*, projects.name as project_name
      from phylo_trees, phylo_trees_pipeline_runs, pipeline_runs, samples
      inner join projects on samples.project_id = projects.id
      where phylo_trees.id = phylo_trees_pipeline_runs.phylo_tree_id and
            phylo_trees_pipeline_runs.pipeline_run_id = pipeline_runs.id and
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
    # Add NCBI metadata
    query_results.index_by { |entry| entry["phylo_tree_id"] }.each do |tree_id, tree_data|
      ncbi_metadata = JSON.parse(tree_data["ncbi_metadata"] || "{}")
      ncbi_metadata.each do |node_id, node_metadata|
        node_metadata["name"] ||= node_metadata["accession"]
        indexed_results[tree_id][node_id] = node_metadata
      end
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
