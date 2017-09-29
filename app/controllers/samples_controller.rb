class SamplesController < ApplicationController
  before_action :set_sample, only: [:show, :edit, :update, :destroy]
  acts_as_token_authentication_handler_for User, only: [:create]
  protect_from_forgery unless: -> { request.format.json? }

  # GET /samples
  # GET /samples.json
  def index
    @samples = Sample.all
  end

  # GET /samples/1
  # GET /samples/1.json
  def show
  end

  # GET /samples/new
  def new
    @sample = Sample.new
  end

  # GET /samples/1/edit
  def edit
  end

  # POST /samples
  # POST /samples.json
  def create
    params = sample_params
    project_name = params.delete(:project_name)
    project = Project.find_by(name: project_name)
    @sample = Sample.new(params)
    @sample.project = project

    respond_to do |format|
      if @sample.save
        format.html { redirect_to @sample, notice: 'Sample was successfully created.' }
        format.json { render :show, status: :created, location: @sample }
      else
        format.html { render :new }
        format.json { render json: @sample.errors, status: :unprocessable_entity }
      end
    end
  end

  # PATCH/PUT /samples/1
  # PATCH/PUT /samples/1.json
  def update
    respond_to do |format|
      if @sample.update!(sample_params)
        format.html { redirect_to @sample, notice: 'Sample was successfully updated.' }
        format.json { render :show, status: :ok, location: @sample }
      else
        format.html { render :edit }
        format.json { render json: @sample.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /samples/1
  # DELETE /samples/1.json
  def destroy
    @sample.destroy
    respond_to do |format|
      format.html { redirect_to samples_url, notice: 'Sample was successfully destroyed.' }
      format.json { head :no_content }
    end
  end

  private

  # Use callbacks to share common setup or constraints between actions.
  def set_sample
    @sample = Sample.find(params[:id])
  end

  # Never trust parameters from the scary internet, only allow the white list through.
  def sample_params
    params.require(:sample).permit(:name, :project_name, :status, :s3_preload_result_path,
                                   :s3_star_index_path, :s3_bowtie2_index_path,
                                   :sample_host, :sample_location, :sample_date, :sample_tissue,
                                   :sample_template, :sample_library, :sample_sequencer, :sample_notes,
                                   input_files_attributes: [:name, :presigned_url, :source_type, :source])
  end
end
