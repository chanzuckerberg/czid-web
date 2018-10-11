class SamplesController < ApplicationController
  include ReportHelper
  include SamplesHelper
  include PipelineOutputsHelper

  ########################################
  # Note to developers:
  # If you are adding a new action to the sample controller, you must classify your action into
  # READ_ACTIONS: where current_user has read access of the sample
  # EDIT_ACTIONS: where current_user has update access of the sample
  # OTHER_ACTIONS: where the actions access multiple samples or non-existing samples.
  #                access control should still be checked as neccessary through current_power
  #
  ##########################################
  skip_before_action :verify_authenticity_token, only: [:create, :update]

  READ_ACTIONS = [:show, :report_info, :search_list, :report_csv, :assembly, :show_taxid_fasta, :nonhost_fasta, :unidentified_fasta, :results_folder, :show_taxid_alignment, :show_taxid_alignment_viz].freeze
  EDIT_ACTIONS = [:edit, :add_taxon_confirmation, :remove_taxon_confirmation, :update, :destroy, :reupload_source, :kickoff_pipeline, :retry_pipeline, :pipeline_runs, :save_metadata].freeze

  OTHER_ACTIONS = [:create, :bulk_new, :bulk_upload, :bulk_import, :new, :index, :all, :show_sample_names, :samples_taxons, :heatmap, :download_heatmap, :cli_user_instructions].freeze

  before_action :authenticate_user!, except: [:create, :update, :bulk_upload]
  acts_as_token_authentication_handler_for User, only: [:create, :update, :bulk_upload], fallback: :devise

  before_action :admin_required, only: [:kickoff_pipeline, :retry_pipeline, :pipeline_runs]
  before_action :no_demo_user, only: [:create, :bulk_new, :bulk_upload, :bulk_import, :new]

  current_power do # Put this here for CLI
    Power.new(current_user)
  end
  power :samples, map: { EDIT_ACTIONS => :updatable_samples }, as: :samples_scope

  before_action :set_sample, only: READ_ACTIONS + EDIT_ACTIONS
  before_action :assert_access, only: OTHER_ACTIONS # Actions which don't require access control check
  before_action :check_access

  PAGE_SIZE = 30
  DEFAULT_MAX_NUM_TAXONS = 30

  # GET /samples
  # GET /samples.json
  def index
    @all_project = current_power.projects
    @page_size = PAGE_SIZE
    project_id = params[:project_id]
    name_search_query = params[:search]
    filter_query = params[:filter]
    tissue_type_query = params[:tissue].split(',') if params[:tissue].present?
    host_query = params[:host].split(',') if params[:host].present?
    sort = params[:sort_by]
    samples_query = JSON.parse(params[:ids]) if params[:ids].present?

    results = current_power.samples

    results = results.where(id: samples_query) if samples_query.present?

    results = results.where(project_id: project_id) if project_id.present?

    # Get tissue types and host genomes that are present in the sample list
    # TODO(yf) : the following tissue_types, host_genomes have performance
    # impact that it should be moved to different dedicated functions. Not
    # parsina the whole results.
    @tissue_types = results.select("distinct(sample_tissue)").map(&:sample_tissue).compact.sort
    host_genome_ids = results.select("distinct(host_genome_id)").map(&:host_genome_id).compact.sort
    @host_genomes = HostGenome.find(host_genome_ids)

    results = results.search(name_search_query) if name_search_query.present?
    results = filter_by_status(results, filter_query) if filter_query.present?
    results = filter_by_tissue_type(results, tissue_type_query) if tissue_type_query.present?
    results = filter_by_host(results, host_query) if host_query.present?

    @samples = sort_by(results, sort).paginate(page: params[:page], per_page: params[:per_page] || PAGE_SIZE).includes([:user, :host_genome, :pipeline_runs, :input_files])
    @samples_count = results.size
    @all_samples = format_samples(@samples)

    render json: { samples: @all_samples, total_count: @samples_count,
                   tissue_types: @tissue_types, host_genomes: @host_genomes }
  end

  def all
    @samples = if params[:ids].present?
                 current_power.samples.where(["id in (?)", params[:ids].to_s])
               else
                 current_power.samples
               end
  end

  # GET /samples/bulk_new
  def bulk_new
    @projects = current_power.updatable_projects
    @host_genomes = host_genomes_list ? host_genomes_list : nil
  end

  def bulk_import
    @project_id = params[:project_id]
    @project = Project.find(@project_id)
    unless current_power.updatable_project?(@project)
      render json: { status: "user is not authorized to update to project #{@project.name}" }, status: :unprocessable_entity
      return
    end

    @host_genome_id = params[:host_genome_id]
    @bulk_path = params[:bulk_path]
    @samples = parsed_samples_for_s3_path(@bulk_path, @project_id, @host_genome_id)
    respond_to do |format|
      format.json do
        if @samples.present?
          render json: { samples: @samples }
        else
          render json: { status: "No samples imported under #{@bulk_path}. Files must have extension fastq.gz/fq.gz/fastq/fq/fasta.gz/fa.gz/fasta/fa." }, status: :unprocessable_entity
        end
      end
    end
  end

  # POST /samples/bulk_upload
  def bulk_upload
    samples = samples_params || []
    editable_project_ids = current_power.updatable_projects.pluck(:id)
    @samples = []
    @errors = []
    samples.each do |sample_attributes|
      sample = Sample.new(sample_attributes)
      next unless editable_project_ids.include?(sample.project_id)
      sample.bulk_mode = true
      sample.user = current_user
      if sample.save
        @samples << sample
      else
        @errors << sample.errors
      end
    end

    respond_to do |format|
      if @errors.empty? && !@samples.empty?
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
    @pipeline_run = select_pipeline_run(@sample, params)
    @amr_counts = nil
    can_see_amr = (current_user.admin? || current_user.allowed_feature_list.include?("AMR"))
    if can_see_amr && @pipeline_run
      amr_state = @pipeline_run.output_states.find_by(output: "amr_counts")
      if amr_state.present? && amr_state.state == PipelineRun::STATUS_LOADED
        @amr_counts = @pipeline_run.amr_counts
      end
    end
    @pipeline_version = @pipeline_run.pipeline_version || PipelineRun::PIPELINE_VERSION_WHEN_NULL if @pipeline_run
    @pipeline_versions = @sample.pipeline_versions

    @pipeline_run_display = curate_pipeline_run_display(@pipeline_run)
    @sample_status = @pipeline_run ? @pipeline_run.job_status_display : 'Uploading'
    pipeline_run_id = @pipeline_run ? @pipeline_run.id : nil
    job_stats_hash = job_stats_get(pipeline_run_id)
    @summary_stats = job_stats_hash.present? ? get_summary_stats(job_stats_hash, @pipeline_run) : nil
    @project_info = @sample.project ? @sample.project : nil
    @project_sample_ids_names = @sample.project ? Hash[current_power.project_samples(@sample.project).map { |s| [s.id, s.name] }] : nil
    @host_genome = @sample.host_genome ? @sample.host_genome : nil
    @background_models = current_power.backgrounds.where(ready: 1)
    @can_edit = current_power.updatable_sample?(@sample)
    @git_version = ENV['GIT_VERSION'] || ""
    @git_version = Time.current.to_i if @git_version.blank?

    @align_viz = false
    align_summary_file = @pipeline_run ? "#{@pipeline_run.alignment_viz_output_s3_path}.summary" : nil
    @align_viz = true if align_summary_file && get_s3_file(align_summary_file)

    background_id = check_background_id(@sample)
    @report_page_params = { pipeline_version: @pipeline_version, background_id: background_id } if background_id
    @report_page_params[:scoring_model] = params[:scoring_model] if params[:scoring_model]
    if @pipeline_run && (((@pipeline_run.adjusted_remaining_reads.to_i > 0 || @pipeline_run.results_finalized?) && !@pipeline_run.failed?) || @pipeline_run.report_ready?)
      if background_id
        @report_present = 1
        @report_ts = @pipeline_run.updated_at.to_i
        @all_categories = all_categories
        @report_details = report_details(@pipeline_run, current_user.id)
        @ercc_comparison = @pipeline_run.compare_ercc_counts
      end

      if @pipeline_run.failed?
        @pipeline_run_retriable = true
      end
    end
  end

  def heatmap
    @heatmap_data = {
      taxonLevels: %w[Genus Species],
      categories: ReportHelper::ALL_CATEGORIES.pluck('name'),
      subcategories: {
        Viruses: ["Phage"]
      },
      metrics: [
        { text: "Aggregate Score", value: "NT.aggregatescore" },
        { text: "NT Z Score", value: "NT.zscore" },
        { text: "NT rPM", value: "NT.rpm" },
        { text: "NT r (total reads)", value: "NT.r" },
        { text: "NR Z Score", value: "NR.zscore" },
        { text: "NR r (total reads)", value: "NR.r" },
        { text: "NR rPM", value: "NR.rpm" }
      ],
      backgrounds: current_power.backgrounds.map do |background|
        { name: background.name, value: background.id }
      end,
      thresholdFilters: {
        targets: [
          { text: "Aggregate Score", value: "NT_aggregatescore" },
          { text: "NT Z Score", value: "NT_zscore" },
          { text: "NT rPM", value: "NT_rpm" },
          { text: "NT r (total reads)", value: "NT_r" },
          { text: "NT %id", value: "NT_percentidentity" },
          { text: "NT log(1/e)", value: "NT_neglogevalue" },
          { text: "NR Z Score", value: "NR_zscore" },
          { text: "NR r (total reads)", value: "NR_r" },
          { text: "NR rPM", value: "NR_rpm" },
          { text: "NR %id", value: "NR_percentidentity" },
          { text: "R log(1/e)", value: "NR_neglogevalue" }
        ],
        operators: [">=", "<="]
      }
    }
  end

  def samples_taxons
    @sample_taxons_dict = sample_taxons_dict(params)
    render json: @sample_taxons_dict
  end

  def download_heatmap
    @sample_taxons_dict = sample_taxons_dict(params)
    output_csv = generate_heatmap_csv(@sample_taxons_dict)
    send_data output_csv, filename: 'heatmap.csv'
  end

  def report_info
    expires_in 30.days
    @pipeline_run = select_pipeline_run(@sample, params)

    ##################################################
    ## Duct tape for changing background id dynamically
    ## TODO(yf): clean the following up.
    ####################################################
    if @pipeline_run && (((@pipeline_run.adjusted_remaining_reads.to_i > 0 || @pipeline_run.finalized?) && !@pipeline_run.failed?) || @pipeline_run.report_ready?)
      background_id = check_background_id(@sample)
      pipeline_run_id = @pipeline_run.id
    end

    @report_info = external_report_info(pipeline_run_id, background_id, params)

    # Fill lineage details into report info.
    # @report_info[:taxonomy_details][2] is the array of taxon rows (which are hashes with keys like tax_id, name, NT, etc)
    @report_info[:taxonomy_details][2] = TaxonLineage.fill_lineage_details(@report_info[:taxonomy_details][2], pipeline_run_id)

    # Label top-scoring hits for the executive summary
    @report_info[:topScoringTaxa] = label_top_scoring_taxa!(@report_info[:taxonomy_details][2])

    render json: JSON.dump(@report_info)
  end

  def search_list
    expires_in 30.days

    @pipeline_run = select_pipeline_run(@sample, params)
    if @pipeline_run
      @search_list = fetch_lineage_info(@pipeline_run.id)
      render json: JSON.dump(@search_list)
    else
      render json: { lineage_map: {}, search_list: [] }
    end
  end

  def save_metadata
    field = params[:field].to_sym
    value = params[:value]
    metadata = { field => value }
    metadata.select! { |k, _v| (Sample::METADATA_FIELDS + [:name]).include?(k) }
    if @sample[field].blank? && value.strip.blank?
      render json: {
        status: "ignored"
      }
    else
      @sample.update_attributes!(metadata)
      render json: {
        status: "success",
        message: "Saved successfully"
      }
    end
  rescue
    error_messages = @sample ? @sample.errors.full_messages : []
    render json: {
      status: 'failed',
      message: 'Unable to update sample',
      errors: error_messages
    }
  end

  def assembly
    pipeline_run = @sample.pipeline_runs.first
    assembly_fasta = pipeline_run.assembly_output_s3_path(params[:taxid])
    send_data get_s3_file(assembly_fasta), filename: @sample.name + '_' + clean_taxid_name(pipeline_run, params[:taxid]) + '-assembled-scaffolds.fasta'
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
    send_data @taxid_fasta, filename: @sample.name + '_' + clean_taxid_name(pipeline_run, params[:taxid]) + '-hits.fasta'
  end

  def show_taxid_alignment
    # TODO(yf): DEPRECATED. Remove by 5/24/2018
    @taxon_info = params[:taxon_info].tr("_", ".")
    pr = @sample.pipeline_runs.first
    s3_file_path = pr.alignment_viz_json_s3(@taxon_info)
    alignment_data = JSON.parse(get_s3_file(s3_file_path) || "{}")
    @taxid = @taxon_info.split(".")[2].to_i
    @tax_level = @taxon_info.split(".")[1]
    @parsed_alignment_results = parse_alignment_results(@taxid, @tax_level, alignment_data)

    respond_to do |format|
      format.json do
        render json: alignment_data
      end
      format.html { @title = @parsed_alignment_results['title'] }
    end
  end

  def show_taxid_alignment_viz
    @taxon_info = params[:taxon_info].split(".")[0]

    pr = select_pipeline_run(@sample, params)

    @taxid = @taxon_info.split("_")[2].to_i
    @tax_level = @taxon_info.split("_")[1]
    @taxon_name = taxon_name(@taxid, @tax_level)
    @pipeline_version = pr.pipeline_version if pr

    respond_to do |format|
      format.json do
        s3_file_path = pr.alignment_viz_json_s3(@taxon_info.tr('_', '.'))
        alignment_data = JSON.parse(get_s3_file(s3_file_path) || "{}")
        flattened_data = {}
        parse_tree(flattened_data, @taxid, alignment_data, true)
        output_array = []
        flattened_data.each do |k, v|
          v["accession"] = k
          v["reads_count"] = v["reads"].size
          output_array << v
        end
        render json: output_array.sort { |a, b| b['reads_count'] <=> a['reads_count'] }
      end
      format.html {}
    end
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

  # GET /samples/new
  def new
    @sample = nil
    @projects = current_power.updatable_projects
    @host_genomes = host_genomes_list ? host_genomes_list : nil
  end

  # GET /samples/1/edit
  def edit
    @project_info = @sample.project ? @sample.project : nil
    @host_genomes = host_genomes_list ? host_genomes_list : nil
    @projects = current_power.updatable_projects
    @input_files = @sample.input_files
  end

  # POST /samples
  # POST /samples.json
  def create
    # Single sample upload path
    params = sample_params

    # Check if the client is up-to-date. "web" is always valid whereas the
    # CLI client should provide a version string to-be-checked against the
    # minimum version here. Bulk upload from CLI goes to this method.
    client = params.delete(:client)
    min_version = Gem::Version.new('0.5.0')
    unless client && (client == "web" || Gem::Version.new(client) >= min_version)
      render json: {
        message: "Outdated command line client. Please run `pip install --upgrade git+https://github.com/chanzuckerberg/idseq-cli.git ` or with sudo + pip2/pip3 depending on your setup.",
        status: :upgrade_required
      }
      return
    end

    if params[:project_name]
      project_name = params.delete(:project_name)
      project = Project.find_by(name: project_name)
      unless project
        project = Project.create(name: project_name)
        project.users << current_user if current_user
      end
    end
    if project && !current_power.updatable_project?(project)
      respond_to do |format|
        format.json { render json: { status: "User not authorized to update project #{project.name}" }, status: :unprocessable_entity }
        format.html { render json: { status: "User not authorized to update project #{project.name}" }, status: :unprocessable_entity }
      end
      return
    end
    if params[:host_genome_name]
      host_genome_name = params.delete(:host_genome_name)
      host_genome = HostGenome.find_by(name: host_genome_name)
    end

    params[:input_files_attributes].select! { |f| f["source"] != '' && current_user.can_upload(f["source"]) }
    @sample = Sample.new(params)
    @sample.project = project if project
    @sample.input_files.each { |f| f.name ||= File.basename(f.source) }
    @sample.user = current_user
    @sample.host_genome ||= (host_genome || HostGenome.first)

    respond_to do |format|
      if @sample.save
        format.html { redirect_to @sample, notice: 'Sample was successfully created.' }
        format.json { render :show, status: :created, location: @sample }
      else
        format.html { render :new }
        format.json do
          render json: { sample_errors: @sample.errors.full_messages,
                         project_errors: project ? project.errors.full_messages : nil },
                 status: :unprocessable_entity
        end
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
    # Will also delete from job_stats, ercc_counts, backgrounds_pipeline_runs, pipeline_runs, input_files, and backgrounds_samples
    deletable = @sample.deletable?(current_user)
    success = false
    success = @sample.destroy if deletable
    respond_to do |format|
      if success
        format.html { redirect_to samples_url, notice: 'Sample was successfully destroyed.' }
        format.json { head :no_content }
      else
        format.html { render :edit }
        format.json { render json: { message: 'Cannot delete this sample. Something went wrong.' }, status: :unprocessable_entity }
      end
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
      if !@sample.pipeline_runs.empty?
        format.html { redirect_to samples_url, notice: 'A pipeline run is in progress.' }
        format.json { head :no_content }
      else
        format.html { redirect_to samples_url, notice: 'No pipeline run in progress.' }
        format.json { render json: @sample.errors.full_messages, status: :unprocessable_entity }
      end
    end
  end

  # PUT /samples/:id/kickoff_pipeline
  def retry_pipeline
    @sample.status = Sample::STATUS_RETRY_PR
    @sample.save
    respond_to do |format|
      if !@sample.pipeline_runs.empty?
        format.html { redirect_to samples_url, notice: 'A pipeline run is in progress.' }
        format.json { head :no_content }
      else
        format.html { redirect_to samples_url, notice: 'No pipeline run in progress.' }
        format.json { render json: @sample.errors.full_messages, status: :unprocessable_entity }
      end
    end
  end

  def pipeline_runs
  end

  def add_taxon_confirmation
    keys = taxon_confirmation_unique_on(params)
    TaxonConfirmation.create(taxon_confirmation_params) unless TaxonConfirmation.find_by(taxon_confirmation_params(keys))
    respond_taxon_confirmations
  end

  def remove_taxon_confirmation
    keys = taxon_confirmation_unique_on(params)
    TaxonConfirmation.where(taxon_confirmation_params(keys)).destroy_all
    respond_taxon_confirmations
  end

  def cli_user_instructions
    render template: "samples/cli_user_instructions"
  end

  # Use callbacks to share common setup or constraints between actions.

  private

  def clean_taxid_name(pipeline_run, taxid)
    return 'all' if taxid == 'all'
    taxid_name = pipeline_run.taxon_counts.find_by(tax_id: taxid).name
    return "taxon-#{taxid}" unless taxid_name
    taxid_name.downcase.gsub(/\W/, "-")
  end

  def sample_taxons_dict(params)
    sample_ids = (params[:sampleIds] || []).map(&:to_i)
    num_results = params[:taxonsPerSample] ? params[:taxonsPerSample].to_i : DEFAULT_MAX_NUM_TAXONS
    taxon_ids = (params[:taxonIds] || []).map do |x|
      begin
        Integer(x)
      rescue ArgumentError
        nil
      end
    end
    taxon_ids = taxon_ids.compact
    categories = params[:categories]
    threshold_filters = if params[:thresholdFilters].is_a?(Array)
                          (params[:thresholdFilters] || []).map { |filter| JSON.parse(filter || "{}") }
                        else
                          JSON.parse(params[:thresholdFilters] || "[]")
                        end
    include_phage = (JSON.parse(params[:subcategories]) || {}).fetch("Viruses", []).include?("Phage")
    read_specificity = params[:readSpecificity] ? params[:readSpecificity].to_i == 1 : false

    # TODO: should fail if field is not well formatted and return proper error to client
    sort_by = params[:sortBy] || ReportHelper::DEFAULT_TAXON_SORT_PARAM
    species_selected = params[:species] == "1" # Otherwise genus selected
    samples = current_power.samples.where(id: sample_ids).includes([:pipeline_runs])
    return {} if samples.empty?

    first_sample = samples.first
    background_id = params[:background] ? params[:background].to_i : check_background_id(first_sample)
    taxon_ids = top_taxons_details(samples, background_id, num_results, sort_by, species_selected, categories, threshold_filters, read_specificity, include_phage).pluck("tax_id") if taxon_ids.empty?

    return {} if taxon_ids.empty?

    samples_taxons_details(samples, taxon_ids, background_id, species_selected)
  end

  def taxon_confirmation_unique_on(params)
    params[:strength] == TaxonConfirmation::WATCHED ? [:sample_id, :taxid, :strength, :user_id] : [:sample_id, :taxid, :strength]
  end

  def taxon_confirmation_params(keys = nil)
    h = { sample_id: @sample.id, user_id: current_user.id, taxid: params[:taxid], name: params[:name], strength: params[:strength] }
    keys ? h.select { |k, _v| k && keys.include?(k) } : h
  end

  def respond_taxon_confirmations
    render json: taxon_confirmation_map(@sample.id, current_user.id)
  end

  def check_background_id(sample)
    background_id = params[:background_id] || sample.default_background_id
    viewable_background_ids = current_power.backgrounds.pluck(:id)
    if viewable_background_ids.include?(background_id.to_i)
      return background_id
    else
      raise "Not allowed to view background"
    end
  end

  def set_sample
    @sample = samples_scope.find(params[:id])
    assert_access
  end

  # Never trust parameters from the scary internet, only allow the white list through.
  def samples_params
    new_params = params.permit(samples: [:name, :project_id, :status, :host_genome_id,
                                         input_files_attributes: [:name, :presigned_url, :source_type, :source]])
    new_params[:samples] if new_params
  end

  def sample_params
    permitted_params = [:name, :project_name, :project_id, :status, :s3_preload_result_path,
                        :s3_star_index_path, :s3_bowtie2_index_path,
                        :host_genome_id, :host_genome_name, :alignment_config_name,
                        :sample_memory, :sample_location, :sample_date, :sample_tissue,
                        :sample_template, :sample_library, :sample_sequencer,
                        :sample_notes, :job_queue, :search, :subsample,
                        :sample_input_pg, :sample_batch, :sample_diagnosis, :sample_organism, :sample_detection, :client,
                        input_files_attributes: [:name, :presigned_url, :source_type, :source, :parts]]
    permitted_params << :pipeline_branch if current_user.admin?
    params.require(:sample).permit(*permitted_params)
  end

  def sort_by(samples, dir = nil)
    default_dir = 'id,desc'
    dir ||= default_dir
    column, direction = dir.split(',')
    samples = samples.order("#{column} #{direction}") if column && direction
    samples
  end
end
