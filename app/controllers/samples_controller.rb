require 'will_paginate/array'

class SamplesController < ApplicationController
  include ReportHelper
  include SamplesHelper
  include PipelineOutputsHelper

  before_action :authenticate_user!, only: [:new, :index, :update, :destroy, :edit, :show, :reupload_source, :kickoff_pipeline, :bulk_new, :bulk_import, :bulk_upload]
  before_action :set_sample, only: [:show, :edit, :update, :destroy, :reupload_source, :kickoff_pipeline, :pipeline_runs, :save_metadata, :report_info, :search_list, :report_csv, :show_taxid_fasta, :nonhost_fasta, :unidentified_fasta, :results_folder, :fastqs_folder]
  acts_as_token_authentication_handler_for User, only: [:create, :bulk_upload], fallback: :devise
  before_action :login_required

  PAGE_SIZE = 30
  REPORT_PAGE_SIZE = 2000
  # GET /samples
  # GET /samples.json
  def index
    @all_project = Project.all
    @page_size = PAGE_SIZE
    project_id = params[:project_id]
    name_search_query = params[:search]
    filter_query = params[:filter]
    tissue_type_query = params[:tissue]
    sort = params[:sort_by]
    samples_query = JSON.parse(params[:ids]) if params[:ids].present?

    results = Sample.includes(:pipeline_runs)

    results = results.where(id: samples_query) if samples_query.present?

    results = results.where(project_id: project_id) if project_id.present?

    results = results.search(name_search_query) if name_search_query.present?
    results = filter_samples(results, filter_query) if filter_query.present?
    results = filter_by_tissue_type(results, tissue_type_query) if tissue_type_query.present?

    @samples = sort_by(results, sort).paginate(page: params[:page], per_page: params[:per_page] || PAGE_SIZE)
    @samples_count = results.size
    @all_samples = format_samples(@samples)

    render json: { samples: @all_samples, total_count: @samples_count }
  end

  def all
    @samples = if params[:ids].present?
                 Sample.where(["id in (?)", params[:ids].to_s])
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

  # GET /samples/1/report_csv
  def report_csv
    @report_csv = report_csv_from_params(@sample, params)
    send_data @report_csv, filename: @sample.name + '_report.csv'
  end

  # GET /samples/1
  # GET /samples/1.json

  def show
    @pipeline_run = @sample.pipeline_runs.first
    @sample_status = @pipeline_run ? @pipeline_run.job_status : nil
    @job_stats = @pipeline_run ? @pipeline_run.job_stats : nil
    @summary_stats = @job_stats ? get_summary_stats(@job_stats) : nil
    @project_info = @sample.project ? @sample.project : nil
    @project_sample_ids_names = @sample.project ? get_samples_in_project(@sample.project) : nil
    @host_genome = @sample.host_genome ? @sample.host_genome : nil
    @background_models = Background.all

    default_background_id = @sample.host_genome && @sample.host_genome.default_background ? @sample.host_genome.default_background.id : nil
    if @pipeline_run && (@pipeline_run.remaining_reads.to_i > 0 || @pipeline_run.finalized?) && !@pipeline_run.failed?
      background_id = params[:background_id] || default_background_id
      if background_id
        @report_present = 1
        @report_ts = @pipeline_run.updated_at.to_i
        @all_categories = all_categories
        @report_details = report_details(@pipeline_run, Background.find(background_id))
        @report_page_params = clean_params(params, @all_categories)
      end
    end
  end

  def report_info
    expires_in 30.days

    @pipeline_run = @sample.pipeline_runs.first
    report_info = {}
    # #######externalz_report_info##########################################
    ## Duct tape for changing background id dynamically
    ## TODO(yf): clean the following up.
    ####################################################
    background_id = nil
    default_background_id = @sample.host_genome && @sample.host_genome.default_background ? @sample.host_genome.default_background.id : nil
    if @pipeline_run && (@pipeline_run.remaining_reads.to_i > 0 || @pipeline_run.finalized?) && !@pipeline_run.failed?
      background_id = params[:background_id] || default_background_id
      pipeline_run_id = @pipeline_run.id
    end

    external_report = external_report_info(pipeline_run_id, background_id, params)
    report_info[:taxonomy_details] = external_report[:taxonomy_details][2].paginate(page: params[:page], per_page: params[:per_page] || REPORT_PAGE_SIZE)
    report_info[:count] = external_report[:taxonomy_details][1]
    report_info[:passing_filters] = external_report[:taxonomy_details][0]
    @report_info = report_info
    render json: @report_info
  end

  def search_list
    expires_in 30.days

    @pipeline_run = @sample.pipeline_runs.first
    if @pipeline_run
      @search_list = fetch_lineage_info(@pipeline_run.id)
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

  def show_taxid_fasta
    if params[:hit_type] == "NT_or_NR"
      nt_array = get_taxid_fasta(@sample, params[:taxid], params[:tax_level].to_i, 'NT').split(">")
      nr_array = get_taxid_fasta(@sample, params[:taxid], params[:tax_level].to_i, 'NR').split(">")
      @taxid_fasta = ">" + ((nt_array | nr_array) - ['']).join(">")
      @taxid_fasta = "Coming soon" if @taxid_fasta == ">" # Temporary fix
    else
      @taxid_fasta = get_taxid_fasta(@sample, params[:taxid], params[:tax_level].to_i, params[:hit_type])
    end
    pipeline_run = @sample.pipeline_runs.first
    taxid_name = pipeline_run.taxon_counts.find_by(tax_id: params[:taxid], tax_level: params[:tax_level]).name
    taxid_name_clean = taxid_name ? taxid_name.downcase.gsub(/\W/, "-") : ''
    send_data @taxid_fasta, filename: @sample.name + '_' + taxid_name_clean + '-hits.fasta'
  end

  def nonhost_fasta
    @nonhost_fasta = get_s3_file(@sample.annotated_fasta_s3_path)
    send_data @nonhost_fasta, filename: @sample.name + '_nonhost.fasta'
  end

  def unidentified_fasta
    @unidentified_fasta = get_s3_file(@sample.unidentified_fasta_s3_path)
    send_data @unidentified_fasta, filename: @sample.name + '_unidentified.fasta'
  end

  def results_folder
    @file_list = @sample.results_folder_files
    @file_path = "#{@sample.sample_path}/results/"
    render template: "samples/folder"
  end

  def fastqs_folder
    @file_list = @sample.fastqs_folder_files
    @file_path = "#{@sample.sample_path}/fastqs/"
    render template: "samples/folder"
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
    @sample.user = current_user if current_user

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
                                   :sample_notes, :job_queue, :search, :subsample,
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
