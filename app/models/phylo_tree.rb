class PhyloTree < ApplicationRecord
  include PipelineOutputsHelper
  include PipelineRunsHelper
  include SamplesHelper
  include ActionView::Helpers::DateHelper

  has_and_belongs_to_many :pipeline_runs
  belongs_to :user, counter_cache: true # use .size for cache, use .count to force COUNT query
  belongs_to :project
  # NOTE: this conflicts with phylo_trees_controller_spec.rb
  # belongs_to :taxon_lineage, class_name: "TaxonLineage", foreign_key: :taxid, primary_key: :taxid

  # TODO: (gdingle): should this be scoped to project or user?
  validates :name, presence: true, uniqueness: { case_sensitive: false }
  validates :taxid, presence: true, if: :mass_validation_enabled?
  validates :tax_name, presence: true, if: :mass_validation_enabled?
  validates :tax_level, presence: true, inclusion: { in: [
    TaxonCount::TAX_LEVEL_SPECIES,
    TaxonCount::TAX_LEVEL_GENUS,
  ], }, if: :mass_validation_enabled?

  STATUS_INITIALIZED = 0
  STATUS_READY = 1
  STATUS_FAILED = 2
  STATUS_IN_PROGRESS = 3
  validates :status, presence: true, inclusion: { in: [
    STATUS_INITIALIZED,
    STATUS_READY,
    STATUS_FAILED,
    STATUS_IN_PROGRESS,
  ], }, if: :mass_validation_enabled?

  after_create :create_visualization

  def self.in_progress
    where(status: STATUS_IN_PROGRESS)
  end

  def self.users_by_tree_id
    ActiveRecord::Base.connection.select_all("
      select phylo_trees.id as phylo_tree_id, users.id, users.name
      from phylo_trees, users
      where phylo_trees.user_id = users.id
      order by phylo_tree_id
    ").index_by { |entry| entry["phylo_tree_id"] }
  end

  def self.viewable(user)
    if user.admin?
      all
    else
      # user can see tree iff user can see all pipeline_runs
      viewable_pipeline_run_ids = PipelineRun.viewable(user).pluck(:id)
      where("id not in (select phylo_tree_id
                        from phylo_trees_pipeline_runs
                        where pipeline_run_id not in (?))", viewable_pipeline_run_ids)
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

  def s3_outputs
    {
      "newick" => {
        "s3_path" => "#{versioned_output_s3_path}/phylo_tree.newick",
        "required" => true,
        "remote" => false,
      },
      "ncbi_metadata" => {
        "s3_path" => "#{versioned_output_s3_path}/ncbi_metadata.json",
        "required" => true,
        "remote" => false,
      },
      "snp_annotations" => {
        "s3_path" => "#{versioned_output_s3_path}/ksnp3_outputs/SNPs_all_annotated",
        "required" => false,
        "remote" => true,
      },
      "vcf" => {
        "s3_path" => "#{versioned_output_s3_path}/ksnp3_outputs/variants_reference1.vcf",
        "required" => false,
        "remote" => true,
      },
    }
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

  def log_url
    return nil unless job_log_id
    AwsUtil.get_cloudwatch_url("/aws/batch/job", job_log_id)
  end

  def monitor_job(throttle = true)
    # Detect if batch job has failed so we can stop polling for results.
    # Also, populate job_log_id.
    return if throttle && rand >= 0.1 # if throttling, do time-consuming aegea checks only 10% of the time
    job_status, job_log_id_response, self.job_description = job_info(job_id, id)
    self.job_log_id = job_log_id_response unless job_log_id # don't overwrite once it's been set (job_log_id_response could be nil after job has terminated)
    required_outputs = select_outputs("required")
    update_pipeline_version(self, :dag_version, dag_version_file) if job_status == "SUCCEEDED" && dag_version.blank?
    if job_status == PipelineRunStage::STATUS_FAILED ||
       (job_status == "SUCCEEDED" && !required_outputs.all? { |ro| exists_in_s3?(s3_outputs[ro]["s3_path"]) })
      self.status = STATUS_FAILED
      LogUtil.log_err_and_airbrake("[Datadog] Phylo tree creation failed for #{name} (#{id}). See #{log_url}.")
    end
    save
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
      LogUtil.log_err_and_airbrake("[Datadog] Phylo tree failed to kick off for #{name} (#{id}).")
    end
    save
  end

  private

  # We need to create a visualization object here to register the new phylo_tree
  # as a generic visualization. Other types of visualizations are saved on-demand only.
  # Because phylo_trees are created explictly, the user will expect them to persist.
  # TODO: (gdingle): destroy visualization objects when phylo_tree is destroyed,
  # and rename when renamed.
  def create_visualization
    Visualization.create(
      user: user,
      visualization_type: "phylo_tree",
      data: { treeId: id },
      name: name,
      samples: Sample.joins(:pipeline_runs)
        .where(pipeline_runs: { id: [pipeline_run_ids] })
        .distinct
    )
  end

  def phylo_tree_output_s3_path
    "s3://#{SAMPLES_BUCKET_NAME}/phylo_trees/#{id}"
  end

  def versioned_output_s3_path
    "#{phylo_tree_output_s3_path}/#{dag_version}"
  end

  def select_outputs(property, value = true)
    s3_outputs.select { |_output, props| props[property] == value }.keys
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
      taxid_column = ActiveRecord::Base.connection.quote_column_name("#{level_str}_taxid")
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
    # Get fasta paths and hitsummary2 paths for each pipeline_run
    hitsummary2_files = {}
    pipeline_runs.each do |pr|
      hitsummary2_files[pr.id] = [
        "#{pr.postprocess_output_s3_path}/assembly/gsnap.hitsummary2.tab",
        "#{pr.postprocess_output_s3_path}/assembly/rapsearch2.hitsummary2.tab",
      ]
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
      hitsummary2_files: hitsummary2_files,
      nt_db: alignment_config.s3_nt_db_path,
      nt_loc_db: alignment_config.s3_nt_loc_db_path,
      sample_names_by_run_ids: sample_names_by_run_ids,
    }
    dag_commands = prepare_dag("phylo_tree", attribute_dict)
    # Dispatch command
    base_command = [install_pipeline(dag_branch),
                    upload_version(dag_version_file),
                    dag_commands,].join("; ")
    aegea_batch_submit_command(base_command)
  end

  # See our dag templates in app/lib/dags.
  def prepare_dag(dag_name, attribute_dict)
    dag_s3 = "#{phylo_tree_output_s3_path}/#{dag_name}.json"
    dag = DagGenerator.new("app/lib/dags/#{dag_name}.json.jbuilder",
                           project_id,
                           nil,
                           nil,
                           attribute_dict,
                           parse_dag_vars)
    self.dag_json = dag.render
    upload_dag_json_and_return_job_command(dag_json, dag_s3, dag_name)
  end

  def sample_names_by_run_ids
    query_results = ActiveRecord::Base.connection.select_all("
      select pipeline_runs.id, samples.name
      from pipeline_runs, samples
      where pipeline_runs.id in (#{pipeline_run_ids.join(',')}) and
            pipeline_runs.sample_id = samples.id
    ").to_a
    result = {}
    query_results.each do |entry|
      result[entry["id"]] = entry["name"]
    end
    result
  end

  def dag_version_file
    "#{phylo_tree_output_s3_path}/#{PipelineRun::PIPELINE_VERSION_FILE}"
  end

  def parse_dag_vars
    JSON.parse(dag_vars || "{}")
  end
end
