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

  def log_url
    return nil unless job_log_id

    AwsUtil.get_cloudwatch_url("/aws/batch/job", job_log_id)
  end

  private

  def phylo_tree_output_s3_path
    "s3://#{SAMPLES_BUCKET_NAME}/phylo_trees/#{id}"
  end

  def versioned_output_s3_path
    "#{phylo_tree_output_s3_path}/#{dag_version}"
  end

  def parse_dag_vars
    JSON.parse(dag_vars || "{}")
  end

  def cleanup_s3
    return if phylo_tree_output_s3_path.blank?

    S3Util.delete_s3_prefix(phylo_tree_output_s3_path)
  end
end
