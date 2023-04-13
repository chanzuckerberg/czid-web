class PhyloTreeNg < ApplicationRecord
  has_and_belongs_to_many :pipeline_runs
  belongs_to :user
  belongs_to :project

  # Newick file representing the phylo tree.
  OUTPUT_NEWICK = "phylotree.phylotree_newick".freeze
  # Metadata JSON for reference sequences downloaded from the NCBI database.
  OUTPUT_NCBI_METADATA = "phylotree.ncbi_metadata_json".freeze
  # SKA distances output for download
  OUTPUT_SKA_DISTANCES = "phylotree.ska_distances".freeze
  # SKA variants output for download
  OUTPUT_SKA_VARIANTS = "phylotree.variants".freeze
  # PNG of a genomic distance matrix (heatmap) for when the samples are too divergent.
  OUTPUT_CLUSTERMAP_PNG = "phylotree.clustermap_png".freeze
  # SVG of a genomic distance matrix (heatmap) for when the samples are too divergent.
  OUTPUT_CLUSTERMAP_SVG = "phylotree.clustermap_svg".freeze

  DOWNLOADABLE_OUTPUTS = [
    OUTPUT_CLUSTERMAP_PNG,
    OUTPUT_CLUSTERMAP_SVG,
    OUTPUT_NEWICK,
    OUTPUT_SKA_DISTANCES,
    OUTPUT_SKA_VARIANTS,
  ].freeze

  INPUT_ERRORS = {
    "TooDivergentError" => "Sequences are too divergent to create a single phylo tree",
  }.freeze

  validates :status, inclusion: { in: WorkflowRun::STATUS.values }
  validates :name, presence: true

  after_create :create_visualization
  before_destroy :cleanup_s3

  scope :by_time, ->(start_date:, end_date:) { where(created_at: start_date.beginning_of_day..end_date.end_of_day) }
  scope :non_deprecated, -> { where(deprecated: false) }
  scope :non_deleted, -> { where(deleted_at: nil) }
  scope :active, -> { non_deprecated.where(status: WorkflowRun::STATUS[:succeeded]) }

  class RerunDeprecatedPhyloTreeNgError < StandardError
    def initialize
      super("Cannot rerun deprecated phylo trees.")
    end
  end

  def dispatch
    SfnPhyloTreeNgDispatchService.call(self)
  end

  def version_tag
    return "phylotree-ng-v#{wdl_version}"
  end

  def results
    {
      newick: output(OUTPUT_NEWICK),
      ncbi_metadata: output(OUTPUT_NCBI_METADATA),
    }
  end

  def self.viewable(user)
    if user.admin?
      all
    else
      # user can see tree iff user can see all pipeline_runs
      viewable_pipeline_run_ids = PipelineRun.viewable(user).pluck(:id)
      viewable_trees = PhyloTreeNg.includes(:pipeline_runs).where(pipeline_runs: { id: viewable_pipeline_run_ids }).references(:pipeline_runs)
      where(id: viewable_trees)
    end.non_deleted
  end

  def self.editable(user)
    if user.admin?
      all
    else
      # user can edit tree IFF user can see tree and user can edit project
      editable_project_ids = Project.editable(user).pluck(:id)
      viewable(user).where(project_id: editable_project_ids)
    end
  end

  # Duplicated from WorkflowRun
  def update_status(remote_status = nil)
    remote_status ||= sfn_execution.description[:status]

    if ["TIMED_OUT", "ABORTED", "FAILED"].include?(remote_status)
      remote_status = WorkflowRun::STATUS[:failed]
    end

    if remote_status == WorkflowRun::STATUS[:failed]
      if input_error.present?
        remote_status = WorkflowRun::STATUS[:succeeded_with_issue]
      else
        Rails.logger.error("PhyloTreeNgFailedEvent: Phylo Tree #{id} by " \
        "#{user.role_name} failed. See: #{sfn_execution_arn}")
      end
    end

    if remote_status != status
      update(status: remote_status)

      # Update the status of the corresponding visualization as well.
      visualization = Visualization.where(data: { "treeNgId" => id }).last
      visualization.update(status: remote_status)
    end
  end

  # Duplicated from WorkflowRun
  def input_error
    sfn_error = sfn_execution.error
    if INPUT_ERRORS.include?(sfn_error)
      return {
        label: sfn_error,
        message: INPUT_ERRORS[sfn_error],
      }
    end
  end

  # Duplicated from WorkflowRun
  def output_path(output_key)
    sfn_execution.output_path(output_key)
  end

  # Duplicated from WorkflowRun
  def output(output_key)
    path = output_path(output_key)
    return S3Util.get_s3_file(path)
  end

  def rerun
    raise RerunDeprecatedPhyloTreeNgError if deprecated?

    # Deprecate the phylo tree and do not show it to the user.
    update!(deprecated: true)

    phylo_tree = PhyloTreeNg.create(
      inputs_json: inputs_json,
      name: name,
      pipeline_run_ids: pipeline_run_ids,
      project_id: project_id,
      rerun_from: id,
      user_id: user_id
    )
    phylo_tree.dispatch
    phylo_tree
  end

  def finalized?
    [WorkflowRun::STATUS[:failed], WorkflowRun::STATUS[:succeeded], WorkflowRun::STATUS[:succeeded_with_issue]].include?(status)
  end

  private

  # Visualizations is a generalized class and they should be 1:1 with a phylo tree or heatmap.
  def create_visualization
    visualizations = Visualization.where(data: { "treeNgId" => id })
    if visualizations.empty?
      Visualization.create(
        user: user,
        visualization_type: "phylo_tree_ng",
        data: { treeNgId: id },
        name: name,
        status: status,
        samples: Sample.viewable(user).joins(:pipeline_runs)
          .where(pipeline_runs: { id: [pipeline_run_ids] })
          .distinct
      )
    else
      Rails.logger.error("VisualizationCreationError: Visualization #{visualizations.ids} has already been created for phylo tree ng #{id}")
    end
  end

  # Duplicated from WorkflowRun
  def sfn_execution
    s3_path = s3_output_prefix # will be set in the dispatch service

    @sfn_execution ||= SfnExecution.new(execution_arn: sfn_execution_arn, s3_path: s3_path, finalized: finalized?)
  end

  def cleanup_s3
    return if s3_output_prefix.blank?

    S3Util.delete_s3_prefix(s3_output_prefix)
  end
end
