class SamplesController < ApplicationController
  before_action :set_sample, only: [:show, :edit, :update, :destroy]
  acts_as_token_authentication_handler_for User, only: [:upsert, :initiate_run]

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

  # GET /samples/upsert
  def upsert
    params.require([:sample_name,:project_name])
    @project = Project.find_by_name(params[:project_name]) || Project.new(:name => params[:project_name])
    @project.save
    @sample  = Sample.find_by_name_and_project_id(params[:sample_name], @project.id) || Sample.new(:name => params[:sample_name])
    @sample.project = @project

    respond_to do |format|
      if @sample.save
        format.json {
          render json: {sample_id: @sample.id, project_id: @project.id}
        }
        format.html {
          output_str = 'Project Id:' + @project.id.to_s + '<br>' + 'Sample Id:' + @sample.id.to_s
          render inline: output_str
        }
      else
        format.json { render json: {status: "Error"}, status: 403 }
        format.html { render inline: "Error saving sample or project", status: 403}
      end
    end
  end

  # GET /samples/:id/initiate_run
  def initiate_run
    params.require(:s3_input_path)
    @sample = Sample.find(params[:id])
    # TODO: kick off the airflow pipeline here
    respond_to do |format|
      format.json {
        render json: { status: "OK!" }
      }
      format.html {
        render inline: "Success"
      }
    end
  end

  # GET /samples/1/edit
  def edit
  end

  # POST /samples
  # POST /samples.json
  def create
    @sample = Sample.new(sample_params)

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
    params.require(:sample).permit(:name, :project_id)
  end
end
