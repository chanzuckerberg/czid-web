class PipelineOutputsController < ApplicationController
  before_action :set_pipeline_output, only: [:show, :edit, :update, :destroy]
  before_action :typed_counts, only: [:show]
  protect_from_forgery unless: -> { request.format.json? }

  # GET /pipeline_outputs
  # GET /pipeline_outputs.json
  def index
    @pipeline_outputs = PipelineOutput.all
  end

  # GET /pipeline_outputs/1
  # GET /pipeline_outputs/1.json
  def show
    @view_level = params[:view_level]
    respond_to do |format|
      format.html
      format.json { render json: @pipeline_output.to_json(include: :taxon_counts) }
    end
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
    project_name = params[:pipeline_output].delete(:project_name)
    sample_name = params[:pipeline_output].delete(:sample_name)
    project = Project.find_by(name: project_name)
    @sample = Sample.find_by(name: sample_name, project: project) || Sample.new(name: sample_name, project: project)
    @sample.save

    @pipeline_output = PipelineOutput.new(pipeline_output_params)
    @pipeline_output.sample = @sample

    # params.require(:job_id)
    fake_job_id = (0...8).map { (65 + rand(26)).chr }. join
    @pipeline_output.pipeline_run = PipelineRun.create(sample: @sample, job_id: fake_job_id)

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

  def typed_counts
    counts = @pipeline_output.taxon_counts
    @nt_species_counts = counts.type('NT').level(TaxonCount::TAX_LEVEL_SPECIES)
    @nr_species_counts = counts.type('NR').level(TaxonCount::TAX_LEVEL_SPECIES)
    @ordered_nt_species_tax_ids = @nt_species_counts.order(count: :desc).where.not("tax_id < 0").map(&:tax_id)
    @ordered_nr_species_tax_ids = @nr_species_counts.order(count: :desc).where.not("tax_id < 0").map(&:tax_id)
    @ordered_species_tax_ids = (@ordered_nt_species_tax_ids + @ordered_nr_species_tax_ids).uniq
    @nt_genus_counts = counts.type('NT').level(TaxonCount::TAX_LEVEL_GENUS)
    @nr_genus_counts = counts.type('NR').level(TaxonCount::TAX_LEVEL_GENUS)
    @ordered_nt_genus_tax_ids = @nt_genus_counts.order(count: :desc).where.not("tax_id < 0").map(&:tax_id)
    @ordered_nr_genus_tax_ids = @nr_genus_counts.order(count: :desc).where.not("tax_id < 0").map(&:tax_id)
    @ordered_genus_tax_ids = (@ordered_nt_genus_tax_ids + @ordered_nr_genus_tax_ids).uniq
  end

  # Use callbacks to share common setup or constraints between actions.
  def set_pipeline_output
    @pipeline_output = PipelineOutput.find(params[:id])
  end

  # Never trust parameters from the scary internet, only allow the white list through.
  def pipeline_output_params
    params.require(:pipeline_output).permit(:sample_id, :name, :total_reads, :remaining_reads, taxon_counts_attributes: [:tax_id, :tax_level, :count, :name, :count_type])
  end
end
