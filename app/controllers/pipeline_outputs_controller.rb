class PipelineOutputsController < ApplicationController
  before_action :set_pipeline_output, only: [:show, :edit, :update, :destroy]
  protect_from_forgery unless: -> { request.format.json? }

  # GET /pipeline_outputs
  # GET /pipeline_outputs.json
  def index
    @pipeline_outputs = PipelineOutput.all
  end

  # GET /pipeline_outputs/1
  # GET /pipeline_outputs/1.json
  def show
  end

  # GET /pipeline_outputs/new
  def new
    @pipeline_output = PipelineOutput.new
  end

  # GET /pipeline_outputs/1/edit
  def edit
  end

  # POST /pipeline_outputs
  # POST /pipeline_outputs.json
  def create
    @pipeline_output = PipelineOutput.new(pipeline_output_params)
    @pipeline_output.name = [@pipeline_output, @pipeline_output.sample.name].join(', ')

    respond_to do |format|
      if @pipeline_output.save
        format.html { redirect_to @pipeline_output, notice: 'Pipeline output was successfully created.' }
        format.json { render :show, status: :created, location: @pipeline_output }
      else
        format.html { render :new }
        format.json { render json: @pipeline_output.errors, status: :unprocessable_entity }
      end
    end
  end

  # PATCH/PUT /pipeline_outputs/1
  # PATCH/PUT /pipeline_outputs/1.json
  def update
    respond_to do |format|
      if @pipeline_output.update(pipeline_output_params)
        format.html { redirect_to @pipeline_output, notice: 'Pipeline output was successfully updated.' }
        format.json { render :show, status: :ok, location: @pipeline_output }
      else
        format.html { render :edit }
        format.json { render json: @pipeline_output.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /pipeline_outputs/1
  # DELETE /pipeline_outputs/1.json
  def destroy
    @pipeline_output.destroy
    respond_to do |format|
      format.html { redirect_to pipeline_outputs_url, notice: 'Pipeline output was successfully destroyed.' }
      format.json { head :no_content }
    end
  end

  private
  # Use callbacks to share common setup or constraints between actions.
  def set_pipeline_output
    @pipeline_output = PipelineOutput.find(params[:id])
  end

  # Never trust parameters from the scary internet, only allow the white list through.
  def pipeline_output_params
    params.require(:pipeline_output).permit(:sample_id, :name, :total_reads, :remaining_reads, taxon_counts_attributes: [:tax_id, :tax_level, :count, :name])
  end
end
