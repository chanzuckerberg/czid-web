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

  validates :name, presence: true, uniqueness: { case_sensitive: false }
  validates :taxid, presence: true
  validates :tax_name, presence: true
  validates :tax_level, presence: true, inclusion: { in: [
    TaxonCount::TAX_LEVEL_SPECIES,
    TaxonCount::TAX_LEVEL_GENUS,
  ] }

  STATUS_INITIALIZED = 0
  STATUS_READY = 1
  STATUS_FAILED = 2
  STATUS_IN_PROGRESS = 3
  validates :status, presence: true, inclusion: { in: [
    STATUS_INITIALIZED,
    STATUS_READY,
    STATUS_FAILED,
    STATUS_IN_PROGRESS,
  ] }

  after_create :create_visualization
  before_destroy :cleanup_s3

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

  def cleanup_s3
    return if phylo_tree_output_s3_path.blank?

    S3Util.delete_s3_prefix(phylo_tree_output_s3_path)
  end
end
