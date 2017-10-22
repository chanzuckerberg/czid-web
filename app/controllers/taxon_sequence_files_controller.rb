class TaxonSequenceFilesController < ApplicationController
  before_action :set_taxon_sequence_file, only: [:show, :edit, :update, :destroy]
  before_action :login_required, only: [:new, :edit, :create, :update, :destroy, :index, :show]

  # GET /taxon_sequence_files
  # GET /taxon_sequence_files.json
  def index
    @taxon_sequence_files = TaxonSequenceFile.all
  end

  # GET /taxon_sequence_files/1
  # GET /taxon_sequence_files/1.json
  def show
  end

  # GET /taxon_sequence_files/new
  def new
    @taxon_sequence_file = TaxonSequenceFile.new
  end

  # GET /taxon_sequence_files/1/edit
  def edit
  end

  # POST /taxon_sequence_files
  # POST /taxon_sequence_files.json
  def create
    @taxon_sequence_file = TaxonSequenceFile.new(taxon_sequence_file_params)
    @taxon_sequence_file.uri = @taxon_sequence_file.generate_fasta
    respond_to do |format|
      if @taxon_sequence_file.save
        format.html { redirect_to @taxon_sequence_file, notice: 'Taxon sequence file was successfully created.' }
        format.json { render :show, status: :created, location: @taxon_sequence_file }
      else
        format.html { render :new }
        format.json { render json: @taxon_sequence_file.errors, status: :unprocessable_entity }
      end
    end
  end

  # PATCH/PUT /taxon_sequence_files/1
  # PATCH/PUT /taxon_sequence_files/1.json
  def update
    respond_to do |format|
      if @taxon_sequence_file.update(taxon_sequence_file_params)
        format.html { redirect_to @taxon_sequence_file, notice: 'Taxon sequence file was successfully updated.' }
        format.json { render :show, status: :ok, location: @taxon_sequence_file }
      else
        format.html { render :edit }
        format.json { render json: @taxon_sequence_file.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /taxon_sequence_files/1
  # DELETE /taxon_sequence_files/1.json
  def destroy
    @taxon_sequence_file.destroy
    respond_to do |format|
      format.html { redirect_to taxon_sequence_files_url, notice: 'Taxon sequence file was successfully destroyed.' }
      format.json { head :no_content }
    end
  end

  private
    # Use callbacks to share common setup or constraints between actions.
    def set_taxon_sequence_file
      @taxon_sequence_file = TaxonSequenceFile.find(params[:id])
    end

    # Never trust parameters from the scary internet, only allow the white list through.
    def taxon_sequence_file_params
      params.require(:taxon_sequence_file).permit(:pipeline_output_id, :taxid)
    end
end
