class SamplesController < ApplicationController
  include ReportHelper
  include SamplesHelper

  before_action :authenticate_user!, only: [:new, :index, :update, :destroy, :edit, :show, :reupload_source, :kickoff_pipeline, :bulk_new, :bulk_import, :bulk_upload]
  before_action :set_sample, only: [:show, :edit, :update, :destroy, :reupload_source, :kickoff_pipeline, :pipeline_runs, :save_metadata, :report_info, :search_list]
  acts_as_token_authentication_handler_for User, only: [:create, :bulk_upload], fallback: :devise
  protect_from_forgery unless: -> { request.format.json? }
  PAGE_SIZE = 30

  # GET /samples
  # GET /samples.json
  def index
    @all_project = Project.all
    @page_size = PAGE_SIZE
    project_id = params[:project_id]
    name_search_query = params[:search]
    filter_query = params[:filter]
    sort = params[:sort_by]
    samples_query = JSON.parse(params[:ids]) if params[:ids].present?

    results = Sample.includes(:pipeline_runs)

    results = results.where(id: samples_query) if samples_query.present?

    results = results.where(project_id: project_id) if project_id.present?

    results = results.search(name_search_query) if name_search_query.present?
    results = filter_samples(results, filter_query) if filter_query.present?

    @samples = sort_by(results, sort).paginate(page: params[:page], per_page: params[:per_page] || PAGE_SIZE)
    @samples_count = results.size
    @all_samples = format_samples(@samples)

    render json: { samples: @all_samples, total_count: @samples_count }
  end

  def all
    @samples = if params[:ids].present?
                 Sample.where(["id in (?)", "#{params[:ids]}")
               else
                 Sample.all
               end
  end

  # GET /samples/bulk_new
  def bulk_new
    @projects = Project.all
    @host_genomes = HostGenome.all
  end

  def bulk_import
    @project_id = params[:project_id]
    @host_genome_id = params[:host_genome_id]
    @bulk_path = params[:bulk_path]
    @samples = parsed_samples_for_s3_path(@bulk_path, @project_id, @host_genome_id)
    respond_to do |format|
      format.json do
        if @samples.present?
          render json: { samples: @samples }
        else
          render json: { status: "No samples imported under #{@bulk_path}" }, status: :unprocessable_entity
        end
      end
    end
  end

  # POST /samples/bulk_upload
  def bulk_upload
    samples = samples_params || []
    @samples = []
    @errors = []
    samples.each do |sample_attributes|
      sample = Sample.new(sample_attributes)
      sample.bulk_mode = true
      sample.user = @user if @user
      if sample.save
        @samples << sample
      else
        @errors << sample.errors
      end
    end

    respond_to do |format|
      if @errors.empty?
        format.json { render json: { samples: @samples, sample_ids: @samples.pluck(:id) } }
      else
        format.json { render json: { samples: @samples, errors: @errors }, status: :unprocessable_entity }
      end
    end
  end

  # GET /samples/1
  # GET /samples/1.json

  def show
    first_pipeline_run = @sample.pipeline_runs.first ? @sample.pipeline_runs.first : nil
    @pipeline_run = first_pipeline_run
    @pipeline_output = first_pipeline_run ? first_pipeline_run.pipeline_output : nil
    @sample_status = first_pipeline_run ? first_pipeline_run.job_status : nil
    @job_stats = @pipeline_output ? @pipeline_output.job_stats : nil
    @summary_stats = @job_stats ? get_summary_stats(@job_stats) : nil
    @project_info = @sample.project ? @sample.project : nil
    @project_sample_ids_names = @sample.project ? get_samples_in_project(@sample.project) : nil
    @host_genome = @sample.host_genome ? @sample.host_genome : nil
    @background_models = Background.all

    ##################################################
    ## Duct tape for changing background id dynamically
    ## TODO(yf): clean the following up.
    ####################################################
    report = nil
    default_background_id = @sample.host_genome && @sample.host_genome.default_background ? @sample.host_genome.default_background.id : nil
    if @pipeline_output &&  (@pipeline_output.remaining_reads.to_i > 0 || @pipeline_run.finalized?)
      report = @pipeline_output.reports.first || Report.new(pipeline_output: @pipeline_output)
      background_id = params[:background_id] || default_background_id || report.background_id
      if background_id
        report.background_id = background_id
        report.name = "#{@sample.id} #{background_id} #{@sample.name}"
        report.save
      else
        report = nil
      end
    end

    if report
      @report_present = 1
      @report_ts = @pipeline_output.updated_at.to_i
      @all_categories = all_categories
      @report_details = report_details(report)
      @report_page_params = clean_params(params, @all_categories)
    end
  end

  def report_info
    expires_in 30.days

    first_pipeline_run = @sample.pipeline_runs.first ? @sample.pipeline_runs.first : nil
    @pipeline_run = first_pipeline_run
    @pipeline_output = first_pipeline_run ? first_pipeline_run.pipeline_output : nil

    ##################################################
    ## Duct tape for changing background id dynamically
    ## TODO(yf): clean the following up.
    ####################################################
    report = nil
    default_background_id = @sample.host_genome && @sample.host_genome.default_background ? @sample.host_genome.default_background.id : nil
    if @pipeline_output &&  (@pipeline_output.remaining_reads.to_i > 0 || @pipeline_run.finalized?)
      report = @pipeline_output.reports.first || Report.new(pipeline_output: @pipeline_output)
      background_id = params[:background_id] || default_background_id || report.background_id
      if background_id
        report.background_id = background_id
        report.name = "#{@sample.id} #{background_id} #{@sample.name}"
        report.save
      else
        report = nil
      end
    end

    @report_info = external_report_info(report, params)
    render json: @report_info
  end

  def search_list
    expires_in 30.days

    first_pipeline_run = @sample.pipeline_runs.first ? @sample.pipeline_runs.first : nil
    @pipeline_run = first_pipeline_run
    @pipeline_output_id = first_pipeline_run ? first_pipeline_run.pipeline_output.id : nil
    if @pipeline_output_id
      @search_list = fetch_lineage_info(@pipeline_output_id)
      render json: @search_list
    else
      render json: { lineage_map: {}, search_list: [] }
    end
  end

  def save_metadata
    field = params[:field].to_sym
    value = params[:value]
    metadata = { field => value }
    metadata.select! { |k, _v| Sample::METADATA_FIELDS.include?(k) }
    if @sample
      unless @sample[field].blank? && value.strip.blank?
        @sample.update_attributes!(metadata)
        respond_to do |format|
          format.json do
            render json: {
              status: "success",
              message: "Saved successfully"
            }
          end
        end
      end
    else
      respond_to do |format|
        format.json do
          render json: {
            status: 'failed',
            message: 'Unable to save sample, sample not found'
          }
        end
      end
    end
  end

  # GET /samples/new
  def new
    @sample = nil
    @projects = Project.all
    @host_genomes = host_genomes_list ? host_genomes_list : nil
  end

  # GET /samples/1/edit
  def edit
    @project_info = @sample.project ? @sample.project : nil
    @host_genomes = host_genomes_list ? host_genomes_list : nil
    @projects = Project.all
    @input_files = @sample.input_files
  end

  # POST /samples
  # POST /samples.json
  def create
    params = sample_params
    if params[:project_name]
      project_name = params.delete(:project_name)
      project = Project.find_by(name: project_name)
    end
    params[:input_files_attributes] = params[:input_files_attributes].reject { |f| f["source"] == '' }
    @sample = Sample.new(params)
    @sample.project = project if project
    @sample.input_files.each { |f| f.name ||= File.basename(f.source) }
    @sample.user = @user if @user

    respond_to do |format|
      if @sample.save
        format.html { redirect_to @sample, notice: 'Sample was successfully created.' }
        format.json { render :show, status: :created, location: @sample }
      else
        format.html { render :new }
        format.json { render json: @sample.errors.full_messages, status: :unprocessable_entity }
      end
    end
  end

  # PATCH/PUT /samples/1
  # PATCH/PUT /samples/1.json
  def update
    respond_to do |format|
      if @sample.update(sample_params)
        format.html { redirect_to @sample, notice: 'Sample was successfully updated.' }
        format.json { render :show, status: :ok, location: @sample }
      else
        format.html { render :edit }
        format.json { render json: @sample.errors.full_messages, status: :unprocessable_entity }
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

  # PUT /samples/:id/reupload_source
  def reupload_source
    Resque.enqueue(InitiateS3Cp, @sample.id)
    respond_to do |format|
      format.html { redirect_to samples_url, notice: "Sample is being uploaded if it hasn't been." }
      format.json { head :no_content }
    end
  end

  # PUT /samples/:id/kickoff_pipeline
  def kickoff_pipeline
    @sample.status = Sample::STATUS_RERUN
    @sample.save
    respond_to do |format|
      format.html { redirect_to samples_url, notice: 'A pipeline run is  in progress.' }
      format.json { head :no_content }
    end
  end

  def pipeline_runs
  end

  # Use callbacks to share common setup or constraints between actions.
  def set_sample
    @sample = Sample.find(params[:id])
  end

  # Never trust parameters from the scary internet, only allow the white list through.
  def samples_params
    new_params = params.permit(samples: [:name, :project_id, :status, :host_genome_id,
                                         input_files_attributes: [:name, :presigned_url, :source_type, :source]])
    new_params[:samples] if new_params
  end

  def sample_params
    params.require(:sample).permit(:name, :project_name, :project_id, :status, :s3_preload_result_path,
                                   :s3_star_index_path, :s3_bowtie2_index_path, :host_genome_id,
                                   :sample_memory, :sample_location, :sample_date, :sample_tissue,
                                   :sample_template, :sample_library, :sample_sequencer,
                                   :sample_notes, :job_queue, :search,
                                   input_files_attributes: [:name, :presigned_url, :source_type, :source])
  end

  def sort_by(samples, dir = nil)
    default_dir = 'id,desc'
    dir ||= default_dir
    column, direction = dir.split(',')
    samples = samples.order("#{column} #{direction}") if column && direction
    samples
  end
end
