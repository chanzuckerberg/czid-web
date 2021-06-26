class PhyloTreeNgsController < ApplicationController
  include ParameterSanitization

  before_action :admin_required, only: [:rerun]

  # TODO: CH-142663
  def index
  end

  # TODO: CH-142663
  def show
  end

  # TODO: CH-142672
  def new
  end

  # TODO: CH-142672
  def create
  end

  # TODO: CH-142676
  def choose_taxon
  end

  # GET /phylo_tree_ngs/validate_name
  def validate_name
    # This just checks if a sanitized name would have an ActiveRecord name error:
    name = sanitize_title_name(collection_params[:name])
    pt = PhyloTreeNg.new(name: name)
    pt.valid?
    render json: {
      valid: !pt.errors.key?(:name),
      sanitizedName: name,
    }
  end

  # PUT /phylo_tree_ngs/:id/rerun
  def rerun
    phylo_tree = current_power.updatable_phylo_tree_ngs.find(member_params[:id])
    phylo_tree.rerun
    render json: { status: "success" }, status: :ok
  rescue StandardError => e
    LogUtil.log_error("Rerun trigger failed", exception: e, phylo_tree_id: phylo_tree&.id)
    render json: {
      status: "error",
      message: e.message,
    }, status: :internal_server_error
  end

  # TODO: CH-142676
  def download
  end

  private

  def collection_params
    params.permit(:name)
  end

  def member_params
    params.permit(:id)
  end
end
