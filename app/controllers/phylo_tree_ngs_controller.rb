class PhyloTreeNgsController < ApplicationController
  include ParameterSanitization

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

  # TODO: CH-142676
  def rerun
  end

  # TODO: CH-142676
  def download
  end

  private

  def collection_params
    params.permit(:name)
  end
end
