class ProjectsController < ApplicationController
  include SequenceLocatorsHelper
  before_action :login_required

  def show_taxid_fasta
    sl = SequenceLocator.find_by(pipeline_output_id: params[:pipeline_output_id],
                                 hit_type: params[:hit_type])
    @taxid_fasta = getTaxidFasta(sl, params[:taxid])
    render plain: @taxid_fasta
  end
end
