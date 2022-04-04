class SamplesController < ApplicationController
  include ApplicationHelper
  include ElasticsearchHelper
  include ErrorHelper
  include LocationHelper
  include PipelineOutputsHelper
  include PipelineRunsHelper
  include ReportHelper
  include SamplesHelper
  include ReportsHelper
  include ParameterSanitization

  ########################################
  # Note to developers:
  # If you are adding a new action to the sample controller, you must classify your action into
  # READ_ACTIONS: where current_user has read access of the sample
  # EDIT_ACTIONS: where current_user has update access of the sample
  # OTHER_ACTIONS: where the actions access multiple samples or non-existing samples.
  #                access control should still be checked as neccessary through current_power
  #
  ##########################################

  # Read action meant for single samples with set_sample before_action
  READ_ACTIONS = [:show, :report_v2, :report_csv, :assembly, :show_taxid_fasta, :nonhost_fasta, :unidentified_fasta,
                  :contigs_fasta, :contigs_fasta_by_byteranges, :contigs_sequences_by_byteranges, :contigs_summary,
                  :results_folder, :show_taxid_alignment, :show_taxid_alignment_viz, :metadata, :amr,
                  :contig_taxid_list, :taxid_contigs_for_blast, :taxid_contigs_download, :taxon_five_longest_reads, :summary_contig_counts, :coverage_viz_summary,
                  :coverage_viz_data, :upload_credentials,].freeze
  EDIT_ACTIONS = [:edit, :update, :destroy, :reupload_source, :kickoff_pipeline,
                  :pipeline_runs, :save_metadata, :save_metadata_v2, :kickoff_workflow, :move_to_project,].freeze

  OTHER_ACTIONS = [:bulk_upload_with_metadata, :bulk_import, :index, :index_v2, :details,
                   :dimensions, :all, :show_sample_names, :cli_user_instructions, :metadata_fields, :samples_going_public,
                   :search_suggestions, :stats, :upload, :validate_sample_files, :taxa_with_reads_suggestions, :uploaded_by_current_user,
                   :taxa_with_contigs_suggestions, :validate_sample_ids, :enable_mass_normalized_backgrounds, :reads_stats, :consensus_genome_clade_export,].freeze
  OWNER_ACTIONS = [:raw_results_folder, :upload_credentials].freeze
  TOKEN_AUTH_ACTIONS = [:update, :bulk_upload_with_metadata, :upload_credentials].freeze

  # For API-like access
  skip_before_action :verify_authenticity_token, only: TOKEN_AUTH_ACTIONS
  prepend_before_action :token_based_login_support, only: TOKEN_AUTH_ACTIONS

  before_action :admin_required, only: [:reupload_source, :kickoff_pipeline, :pipeline_runs, :move_to_project]
  before_action :login_required, only: [:bulk_import]

  # Read actions are mapped to viewable_samples scope and Edit actions are mapped to updatable_samples.
  power :samples, map: { EDIT_ACTIONS => :updatable_samples }, as: :samples_scope

  before_action :set_sample, only: READ_ACTIONS + EDIT_ACTIONS + OWNER_ACTIONS
  before_action :assert_access, only: OTHER_ACTIONS # Actions which don't require access control check
  before_action :check_owner, only: OWNER_ACTIONS
  before_action :check_access
  before_action only: :amr do
    allowed_feature_required("AMR")
  end

  around_action :instrument_with_timer

  MAX_PAGE_SIZE_V2 = 100
  MAX_BINS = 34
  MIN_CLI_VERSION = '3.0.0'.freeze
  CLI_DEPRECATION_MSG = "Outdated command line client. Please install a new version of czid-cli. See installation instructions: https://github.com/chanzuckerberg/czid-cli".freeze

  SAMPLE_DEFAULT_FIELDS = [
    :name,
    :created_at,
    :updated_at,
    :project_id,
    :status,
    :host_genome_id,
    :upload_error,
    :initial_workflow,
  ].freeze

  WORKFLOW_RUN_DEFAULT_FIELDS = [
    :deprecated,
    :executed_at,
    :id,
    :status,
    :wdl_version,
    :workflow,
  ].freeze

  def index_v2
    # this method is going to replace 'index' once we fully migrate to the
    # discovery views (old one was kept to avoid breaking the current interface
    # without sacrificing speed of development)
    domain = params[:domain]
    order_by = params[:orderBy] || :id
    order_dir = params[:orderDir] || :desc
    limit = params[:limit] ? params[:limit].to_i : MAX_PAGE_SIZE_V2
    offset = params[:offset].to_i

    list_all_sample_ids = ActiveModel::Type::Boolean.new.cast(params[:listAllIds])

    samples = fetch_samples(domain: domain, filters: params)
    samples = samples.order(Hash[order_by => order_dir])
    limited_samples = samples.offset(offset).limit(limit)

    limited_samples_json = limited_samples.includes(:project).as_json(
      only: [:id, :name, :host_genome_id, :project_id, :created_at],
      methods: [:private_until]
    )

    basic = ActiveModel::Type::Boolean.new.cast(params[:basic])
    # If basic requested, then don't include extra details (ex: metadata) for each sample.
    unless basic
      samples_visibility = get_visibility_by_sample_id(limited_samples.pluck(:id))
      # format_samples loads a lot of information about samples
      # There are many ways we can refactor: multiple endpoints for client to ask for the information
      # they actually need or at least a configurable function to get only certain data
      # NOTE: `details_json` guarantees the order of samples, but it would be good to make it indexed on id too
      details_json = format_samples(limited_samples).as_json(
        except: [:sfn_results_path]
      )
      limited_samples_json.zip(details_json).map do |sample, details|
        sample[:public] = samples_visibility[sample["id"]]
        sample[:details] = details
      end
    end

    results = { samples: limited_samples_json }
    results[:all_samples_ids] = samples.pluck(:id) if list_all_sample_ids

    # Refactor once we have a clear API definition policy
    respond_to do |format|
      format.json do
        # TODO(tiago): a lot of the values return by format_sample do not make sense on a sample controller
        render json: results
      end
    end
  end

  # POST /samples/validate_sample_ids
  #
  # Validate access to sample ids, and that the samples
  # have completed and succeeded processing.
  # Filters out samples with a pipeline or workflow run still in progress,
  # with a failed latest run, and those the user does not have read
  # access to.
  #
  # Returns a list of valid sample ids and the names of samples the
  # user has access to, but have not successfully completed.
  #
  # This is a POST route and not a GET request because Puma does not allow
  # query strings longer than a certain amount (1024 * 10 chars), which causes
  # trouble with projects with a large number of samples.
  def validate_sample_ids
    queried_sample_ids = params[:sampleIds]
    workflow = params.key?(:workflow) ? params[:workflow] : WorkflowRun::WORKFLOW[:short_read_mngs]

    # We want to return valid sample ids, but for invalid samples we need their names to display
    # to the user. No information is returned on samples they don't have access to.
    validated_sample_info = SampleAccessValidationService.call(queried_sample_ids, current_user)
    viewable_samples = validated_sample_info[:viewable_samples]
    if validated_sample_info[:error].nil?
      valid_sample_ids = if workflow == WorkflowRun::WORKFLOW[:short_read_mngs]
                           get_succeeded_pipeline_runs_for_samples(viewable_samples, false, [:sample_id]).pluck(:sample_id)
                         else
                           WorkflowRun.where(sample_id: viewable_samples.pluck(:id), workflow: workflow).active.pluck(:sample_id)
                         end

      invalid_samples = viewable_samples.reject { |sample| valid_sample_ids.include?(sample.id) }
      invalid_sample_names = invalid_samples.map(&:name)

      render json: {
        validIds: valid_sample_ids,
        invalidSampleNames: invalid_sample_names,
        error: nil,
      }
    else
      render json: {
        validIds: [],
        invalidSampleNames: [],
        error: validated_sample_info[:error],
      }
    end
  end

  # POST /samples/enable_mass_normalized_backgrounds
  def enable_mass_normalized_backgrounds
    sample_ids = params[:sampleIds]
    samples = current_power.samples.where(id: sample_ids)
    latest_pipeline_runs = PipelineRun.latest_by_sample(samples)

    samples_have_pipeline_runs = (sample_ids.length == latest_pipeline_runs.length)
    samples_have_erccs = latest_pipeline_runs.all? { |pr| ((pr.total_ercc_reads || 0) > 0) }
    samples_have_correct_pr_versions = latest_pipeline_runs.all? { |pr| pipeline_version_at_least(pr.pipeline_version, "4.0") }
    mass_normalized_backgronds_available = samples_have_pipeline_runs && samples_have_erccs && samples_have_correct_pr_versions

    render json: {
      massNormalizedBackgroundsAvailable: mass_normalized_backgronds_available,
      samplesHavePipelineRuns: samples_have_pipeline_runs,
      samplesHaveERCCs: samples_have_erccs,
      samplesHaveCorrectPRVersions: samples_have_correct_pr_versions,
    }
  end

  def dimensions
    @timer.add_tags([
                      "domain:#{params[:domain]}",
                    ])

    # TODO(tiago): consider split into specific controllers / models
    domain = params[:domain]
    share_id = params[:share_id]
    param_sample_ids = (params[:sampleIds] || []).map(&:to_i)
    # Access control enforced within samples_by_domain
    samples = domain == "snapshot" ? samples_by_share_id(share_id) : samples_by_domain(domain)
    unless param_sample_ids.empty?
      samples = samples.where(id: param_sample_ids)
    end
    samples = filter_samples(samples, params)

    sample_ids = samples.pluck(:id)
    samples_count = samples.count
    @timer.split("prep_samples")

    locations = LocationHelper.sample_dimensions(sample_ids, "collection_location", samples_count)
    @timer.split("locations")

    locations_v2 = LocationHelper.sample_dimensions(sample_ids, "collection_location_v2", samples_count)
    @timer.split("locations_v2")

    sample_types = SamplesHelper.samples_by_metadata_field(sample_ids, "sample_type").count
    sample_types = sample_types.map do |sample_type, count|
      { value: sample_type, text: sample_type, count: count }
    end
    not_set_count = samples_count - sample_types.sum { |l| l[:count] }
    if not_set_count > 0
      sample_types << { value: "not_set", text: "Unknown", count: not_set_count }
    end
    @timer.split("sample_types")

    # visibility
    public_count = samples.public_samples.count
    private_count = samples_count - public_count
    visibility = [
      { value: "public", text: "Public", count: public_count },
      { value: "private", text: "Private", count: private_count },
    ]
    @timer.split("visibility")

    times = [
      { value: "1_week", text: "Last Week", count: samples.where("samples.created_at >= ?", 1.week.ago.utc).count },
      { value: "1_month", text: "Last Month", count: samples.where("samples.created_at >= ?", 1.month.ago.utc).count },
      { value: "3_month", text: "Last 3 Months", count: samples.where("samples.created_at >= ?", 3.months.ago.utc).count },
      { value: "6_month", text: "Last 6 Months", count: samples.where("samples.created_at >= ?", 6.months.ago.utc).count },
      { value: "1_year", text: "Last Year", count: samples.where("samples.created_at >= ?", 1.year.ago.utc).count },
    ]
    @timer.split("times")

    # TODO(tiago): move grouping to a helper function (similar code in projects_controller)
    time_bins = []
    if samples_count > 0
      min_date = samples.minimum(:created_at).utc.to_date
      max_date = samples.maximum(:created_at).utc.to_date
      span = (max_date - min_date + 1).to_i
      if span <= MAX_BINS
        # we group by day if the span is shorter than MAX_BINS days
        bins_map = samples.group("DATE(`samples`.`created_at`)").count.map do |timestamp, count|
          [timestamp.strftime("%Y-%m-%d"), count]
        end.to_h
        time_bins = (0...span).map do |offset|
          date = (min_date + offset.days).to_s
          {
            value: date,
            text: date,
            count: bins_map[date] || 0,
          }
        end
      else
        # we group by equally spaced MAX_BINS bins to cover the necessary span
        step = (span.to_f / MAX_BINS).ceil
        bins_map = samples.group(
          ActiveRecord::Base.send(
            :sanitize_sql_array,
            ["FLOOR(TIMESTAMPDIFF(DAY, :min_date, `samples`.`created_at`)/:step)", { min_date: min_date, step: step }]
          )
        ).count
        time_bins = (0...MAX_BINS).map do |bucket|
          start_date = min_date + (bucket * step).days
          end_date = start_date + step - 1
          {
            interval: { start: start_date, end: end_date },
            count: bins_map[bucket] || 0,
            value: "#{start_date}:#{end_date}",
            text: "#{start_date} - #{end_date}",
          }
        end
      end
    end
    @timer.split("time_bins")

    hosts = samples.joins(:host_genome).group(:host_genome).count
    hosts = hosts.map do |host, count|
      { value: host.id, text: host.name, count: count }
    end
    @timer.split("hosts")

    respond_to do |format|
      format.json do
        render json: [
          { dimension: "location", values: locations },
          { dimension: "locationV2", values: locations_v2 },
          { dimension: "visibility", values: visibility },
          { dimension: "time", values: times },
          { dimension: "time_bins", values: time_bins },
          { dimension: "host", values: hosts },
          # Keep "tissue" for legacy compatibility. It's too hard to rename all JS
          # instances to "sample_type"
          { dimension: "tissue", values: sample_types },
        ]
      end
    end
  end

  def stats
    domain = params[:domain]
    share_id = params[:share_id]

    samples = domain == "snapshot" ? samples_by_share_id(share_id) : samples_by_domain(domain)
    samples = filter_samples(samples, params)
    sample_data = samples.pluck(:id, :project_id)
    sample_ids = sample_data.map { |s| s[0] }
    project_ids = sample_data.map { |s| s[1] }.uniq
    avg_total_reads = nil
    avg_remaining_reads = nil
    workflow_count = {
      WorkflowRun::WORKFLOW[:short_read_mngs] => samples.where(initial_workflow: WorkflowRun::WORKFLOW[:short_read_mngs]).distinct.count,
      WorkflowRun::WORKFLOW[:consensus_genome] => samples.joins(:workflow_runs).where(["workflow_runs.workflow = :workflow OR samples.initial_workflow = :workflow", { workflow: WorkflowRun::WORKFLOW[:consensus_genome] }]).distinct.count,
    }

    if sample_ids.count > 0
      pipeline_run_ids = top_pipeline_runs_multiget(sample_ids).values
      avg_total_reads, avg_remaining_reads = PipelineRun
                                             .where(id: pipeline_run_ids)
                                             .pick(Arel.sql("ROUND(AVG(`pipeline_runs`.`total_reads`)), ROUND(AVG(`pipeline_runs`.`adjusted_remaining_reads`))"))
                                             &.map(&:to_i)
    end

    respond_to do |format|
      format.json do
        render json: {
          countByWorkflow: workflow_count,
          count: sample_ids.count,
          projectCount: project_ids.count,
          avgTotalReads: avg_total_reads.presence || 0,
          avgAdjustedRemainingReads: avg_remaining_reads.presence || 0,
        }
      end
    end
  end

  def all
    @samples = if params[:ids].present?
                 current_power.samples.where(["id in (?)", params[:ids].to_s])
               else
                 current_power.samples
               end
  end

  def search_suggestions
    query = params[:query]
    # TODO: move into a search_controller or into separate controllers/models
    categories = params[:categories]
    domain = params[:domain]

    # Generate structure required by CategorySearchBox
    # Not permission-dependent
    results = {}

    # Need users
    if !categories || ["project", "sample", "location", "tissue", "uploader"].any? { |i| categories.include? i }
      # Admin-only for now: needs permissions scoping
      users = current_user.admin ? prefix_match(User, "name", query, {}) : []
    end

    if !categories || categories.include?("project")
      projects = current_power.projects_by_domain(domain).search_by_name(query)
      unless projects.empty?
        results["Project"] = {
          "name" => "Project",
          "results" => projects.index_by(&:name).map do |_, p|
            { "category" => "Project", "title" => p.name, "id" => p.id }
          end,
        }
      end
    end
    if (!categories || categories.include?("uploader")) && !users.empty?
      results["Uploader"] = {
        "name" => "Uploader",
        "results" => users.group_by(&:name).map do |val, records|
          { "category" => "Uploader", "title" => val, "id" => records.pluck(:id) }
        end,
      }
    end

    # Permission-dependent
    if !categories || ["sample", "location", "tissue", "taxon"].any? { |i| categories.include? i }
      constrained_samples = samples_by_domain(domain)
      constrained_samples = filter_samples(constrained_samples, params)
      constrained_sample_ids = constrained_samples.pluck(:id)

    end

    if !categories || categories.include?("host")
      hosts = constrained_samples
              .joins(:host_genome)
              .where("`host_genomes`.name LIKE :search", search: "#{query}%")
              .distinct(:host_genome)
      unless hosts.empty?
        results["Host"] = {
          "name" => "Host",
          "results" => hosts.map do |h|
            { "category" => "Host", "title" => h.name, "id" => h.id }
          end,
        }
      end
    end

    if !categories || categories.include?("sample")
      samples = constrained_samples.search_by_name(query)
      unless samples.empty?
        results["Sample"] = {
          "name" => "Sample",
          # group_by so that samples with same name show up adjacent
          "results" => samples.group_by(&:name).flat_map do |_, records|
            records.map do |record|
              {
                "category" => "Sample",
                "description" => "Project: #{record.project.name}",
                "id" => record.name,
                "key" => "sample-#{record.id}",
                "project_id" => record.project_id,
                "sample_id" => record.id,
                "title" => record.name,
              }
            end
          end,
        }
      end
    end

    if !categories || categories.include?("location")
      locations = prefix_match(Metadatum, "string_validated_value", query, sample_id: constrained_sample_ids).where(key: "collection_location")
      unless locations.empty?
        results["Location"] = {
          "name" => "Location",
          "results" => locations.pluck(:string_validated_value).uniq.map do |val|
                         { "category" => "Location", "title" => val, "id" => val }
                       end,
        }
      end
    end

    if !categories || categories.include?("tissue")
      sample_types = prefix_match(Metadatum, "string_validated_value", query, sample_id: constrained_sample_ids).where(key: "sample_type")
      unless sample_types.empty?
        # Keep "tissue" for legacy compatibility. It's too hard to rename all JS
        # instances to "sample_type".
        results["Tissue"] = {
          "name" => "Tissue",
          "results" => sample_types.pluck(:string_validated_value).uniq.map do |val|
            { "category" => "Tissue", "title" => val, "id" => val }
          end,
        }
      end
    end

    if !categories || categories.include?("taxon")
      taxon_list = taxon_search(query, ["species", "genus"], samples: constrained_samples)
      unless taxon_list.empty?
        results["Taxon"] = {
          "name" => "Taxon",
          "results" => taxon_list.map do |entry|
            entry.merge("category" => "Taxon")
          end,
        }
      end
    end

    render json: JSON.dump(results)
  end

  def bulk_import
    @project_id = params[:project_id]
    @project = Project.find(@project_id)
    unless current_power.updatable_project?(@project)
      render json: { status: "Sorry, your email doesn’t have permissions to upload to this project." }, status: :unprocessable_entity
      return
    end

    unless current_user.can_upload(params[:bulk_path])
      render json: { status: "Sorry, it looks like your email doesn’t have permissions to this s3 bucket." }, status: :unprocessable_entity
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
          render json: { status: "Sorry, we couldn’t find any valid samples in this s3 bucket. There may be an issue with permissions or the file format. Click the \"More Info\" link above for more detailed instructions." }, status: :unprocessable_entity
        end
      end
    end
  end

  # POST /samples/bulk_upload_with_metadata
  def bulk_upload_with_metadata
    samples_to_upload = samples_params || []
    metadata = params[:metadata] || {}
    client = params[:client]
    errors = []

    client_type = client == "web" ? client : "cli"
    samples_to_upload.each_with_index do |sample, sample_idx|
      (sample[:input_files_attributes] || []).each_with_index do |_, input_file_idx|
        samples_to_upload[sample_idx][:input_files_attributes][input_file_idx][:upload_client] = client_type
      end
    end
    version_number = client.sub(/-.*$/, "")
    # Check if the client is up-to-date. "web" is always valid whereas the
    # CLI client should provide a version string to-be-checked against the
    # minimum version here. Bulk upload from CLI goes to this method.
    min_version = Gem::Version.new(MIN_CLI_VERSION)
    version_obj = client && client != "web" && Gem::Version.new(version_number)
    unless client && (client == "web" || version_obj >= min_version)
      render json: {
        message: CLI_DEPRECATION_MSG,
        # idseq-cli v0.6.0 only checks the 'errors' field, so ensure users see this.
        errors: [CLI_DEPRECATION_MSG],
        status: :upgrade_required,
      }, status: :upgrade_required
      return
    end

    editable_project_ids = current_power.updatable_projects.pluck(:id)

    samples_to_upload, samples_invalid_projects = samples_to_upload.partition { |sample| editable_project_ids.include?(Integer(sample[:project_id])) }

    # For invalid projects, don't attempt to upload metadata.
    samples_invalid_projects.each do |sample|
      metadata.delete(sample["name"])
      errors << SampleUploadErrors.invalid_project_id(sample)
    end

    # Apply project defaults such as subsample_default and max_input_fragments_default.
    # Get all projects that are targeted by this upload.
    sample_projects = Project.where(id: samples_to_upload.pluck(:project_id).uniq)
    sample_projects_by_id = Hash[sample_projects.pluck(:id).zip(sample_projects)]

    samples_to_upload.each do |sample_attributes|
      sample_project = sample_projects_by_id[sample_attributes[:project_id].to_i]

      # If the project has a subsample_default, and subsample was not set in admin options, use the project default.
      if sample_project.subsample_default.present? && sample_attributes[:subsample].nil?
        sample_attributes[:subsample] = sample_project.subsample_default
      end
      # If the project has a max_input_fragments_default, and max_input_fragments was not set in admin options, use the project default.
      if sample_project.max_input_fragments_default.present? && sample_attributes[:max_input_fragments].nil?
        sample_attributes[:max_input_fragments] = sample_project.max_input_fragments_default
      end
    end

    # TODO(mark): Remove these whitelist app config parameters once the project defaults rolls out.
    subsample_whitelist_default_subsample = get_app_config(AppConfig::SUBSAMPLE_WHITELIST_DEFAULT_SUBSAMPLE).to_i
    subsample_whitelist_default_max_input_fragments = get_app_config(AppConfig::SUBSAMPLE_WHITELIST_DEFAULT_MAX_INPUT_FRAGMENTS).to_i
    subsample_whitelist_project_ids = get_json_app_config(AppConfig::SUBSAMPLE_WHITELIST_PROJECT_IDS)

    # For samples uploaded to biohub project ids, set the alternative default subsample and max_input_fragments values.
    # Note that we cannot instead set these values on the pipeline run because s3 upload (which uses max_input_fragments)
    # occurs before the pipeline run is created.
    # This is intended to be a temporary short-term mechanism to service critical projects with our partners.
    if subsample_whitelist_project_ids.is_a?(Array)
      samples_to_upload.each do |sample_attributes|
        if subsample_whitelist_project_ids.include?(sample_attributes[:project_id].to_i)
          if subsample_whitelist_default_subsample > 0
            sample_attributes[:subsample] = subsample_whitelist_default_subsample
          end
          if subsample_whitelist_default_max_input_fragments > 0
            sample_attributes[:max_input_fragments] = subsample_whitelist_default_max_input_fragments
          end
        end
      end
    end

    upload_errors, samples = upload_samples_with_metadata(samples_to_upload, metadata, current_user).values_at("errors", "samples")

    errors.concat(upload_errors)

    # After creation, if a sample is missing required metadata, destroy it.
    # TODO(mark): Move this logic into a validator in the model in the future.
    # Hard to do right now because this isn't launched yet, and also many existing samples don't have required metadata.
    removed_samples = []
    samples.includes(host_genome: [:metadata_fields], project: [:metadata_fields], metadata: [:metadata_field]).each do |sample|
      missing_required_metadata_fields = sample.missing_required_metadata_fields
      unless missing_required_metadata_fields.empty?
        errors << SampleUploadErrors.missing_required_metadata(sample, missing_required_metadata_fields.pluck(:name))
        sample.destroy
        removed_samples << sample
      end
    end
    samples -= removed_samples

    warn_if_large_bulk_upload(samples)

    resp = { samples: samples, sample_ids: samples.pluck(:id), errors: errors }

    if client == "web" && samples.any?
      web_samples = samples.map do |sample|
        input_files = sample.input_files.map do |input_file|
          {}.tap do |file_hash|
            file_hash[:id] = input_file.id
            file_hash[:name] = input_file.name
            file_hash[:presigned_url] = input_file.presigned_url unless current_user.allowed_feature?("local_multipart_uploads")
            file_hash[:s3_bucket] = ENV["SAMPLES_BUCKET_NAME"]
            file_hash[:s3_file_path] = input_file.file_path
          end
        end
        {
          id: sample.id,
          name: sample.name,
          input_files: input_files,
        }
      end
      resp = { samples: web_samples, sample_ids: samples.pluck(:id), errors: errors }
    end

    if client != "web" && samples.any?
      v2_samples = samples.map do |sample|
        input_files = sample.input_files.map do |input_file|
          {
            multipart_upload_id: input_file.multipart_upload_id,
            s3_path: input_file.s3_path,
          }
        end
        {
          id: sample.id,
          name: sample.name,
          input_files: input_files,
        }
      end
      resp = { samples: v2_samples, errors: errors }
    end

    samples.each do |sample|
      MetricUtil.log_analytics_event(
        EventDictionary::SAMPLE_UPLOAD_STARTED,
        current_user,
        {
          version: client, # web if web version number if cli
          client: client_type, # here we map version number to CLI for easier queries
          sample_id: sample.id,
        }
      )
    end

    respond_to do |format|
      format.json { render json: resp }
    end
  end

  # GET /samples/1/upload_credentials
  def upload_credentials
    unless @sample.status == Sample::STATUS_CREATED
      render json: {
        error: "This sample was already uploaded.",
      }, status: :unauthorized
      return
    end
    credentials = get_upload_credentials([@sample])[:credentials]
    respond_to do |format|
      format.json { render json: { aws_region: ENV["AWS_REGION"] }.merge(credentials) }
    end
  end

  # GET /samples/1/report_csv
  def report_csv
    pipeline_run = select_pipeline_run(@sample, params[:pipeline_version])
    background_id = get_background_id(@sample, params[:background])
    min_contig_reads = params[:min_contig_reads] || PipelineRun::MIN_CONTIG_READS
    @report_csv = PipelineReportService.call(pipeline_run, background_id, csv: true, min_contig_reads: min_contig_reads)
    send_data @report_csv, filename: @sample.name + '_report.csv'
  end

  # GET /samples/1/metadata
  # GET /samples/1/metadata.json
  def metadata
    # Information needed to show the samples metadata sidebar.
    pr = select_pipeline_run(@sample, params[:pipeline_version])
    summary_stats = nil
    pr_display = nil
    ercc_comparison = nil

    editable = current_power.updatable_sample?(@sample)

    if pr
      pr_display = curate_pipeline_run_display(pr)
      ercc_comparison = pr.compare_ercc_counts

      job_stats_hash = job_stats_get(pr.id)
      if job_stats_hash.present?
        summary_stats = get_summary_stats(job_stats_hash, pr)
      end
    end

    render json: {
      # Pass down base_type for the frontend
      metadata: @sample.metadata_with_base_type,
      additional_info: {
        name: @sample.name,
        editable: editable,
        host_genome_name: @sample.host_genome_name,
        host_genome_taxa_category: @sample.host_genome.taxa_category,
        upload_date: @sample.created_at,
        project_name: @sample.project.name,
        project_id: @sample.project_id,
        notes: @sample.sample_notes,
        ercc_comparison: ercc_comparison,
        pipeline_run: pr_display,
        summary_stats: summary_stats,
      },
    }
  end

  # Get MetadataFields for the array of sampleIds (could be 1)
  def metadata_fields
    sample_ids = (params[:sampleIds] || []).map(&:to_i)

    if sample_ids.length == 1
      @sample = current_power.viewable_samples.find(sample_ids[0])
      results = @sample.metadata_fields_info
    else
      # Get the MetadataFields that are on the Samples' Projects and HostGenomes
      samples = current_power.viewable_samples.where(id: sample_ids)
      project_ids = samples.distinct.pluck(:project_id)
      host_genome_ids = samples.distinct.pluck(:host_genome_id)

      project_fields = Project.where(id: project_ids).includes(metadata_fields: [:host_genomes]).map(&:metadata_fields)
      host_genome_fields = HostGenome.where(id: host_genome_ids).includes(metadata_fields: [:host_genomes]).map(&:metadata_fields)
      results = (project_fields.flatten & host_genome_fields.flatten).map(&:field_info)
    end

    render json: results
  end

  # POST /samples/1/save_metadata_v2
  def save_metadata_v2
    result = @sample.metadatum_add_or_update(params[:field], params[:value])
    if result[:status] == "ok"
      render json: {
        status: "success",
        message: "Saved successfully",
      }
    else
      render json: {
        status: 'failed',
        message: result[:error],
      }
    end
  end

  # GET /samples/1
  # GET /samples/1.json
  def show
    respond_to do |format|
      format.html
      format.json do
        render json: @sample
          .as_json(
            methods: [],
            only: SAMPLE_DEFAULT_FIELDS,
            include: {
              project: {
                only: [:id, :name],
              },
            }
          ).merge(
            default_background_id: @sample.default_background_id,
            default_pipeline_run_id: @sample.first_pipeline_run.present? ? @sample.first_pipeline_run.id : nil,
            deletable: @sample.deletable?(current_user),
            editable: current_power.updatable_sample?(@sample),
            pipeline_runs: @sample.pipeline_runs_info,
            workflow_runs: @sample.workflow_runs.non_deprecated.reverse.as_json(
              only: WORKFLOW_RUN_DEFAULT_FIELDS,
              methods: [:input_error, :inputs, :parsed_cached_results]
            )
          )
      end
    end

    # Duplicates PipelineSampleReport_sample_viewed to compare frontend vs. backend tracks
    MetricUtil.log_analytics_event(EventDictionary::SAMPLES_CONTROLLER_SAMPLE_VIEWED, current_user, { sample_id: @sample&.id }, request)
  end

  def samples_going_public
    ahead = (params[:ahead] || 10).to_i
    behind = params[:behind].to_i

    start = Time.current - behind.days
    samples = current_power.samples.samples_going_public_in_period(
      [start, start + ahead.days],
      params[:userId] ? User.find(params[:userId]) : current_user,
      params[:projectId] ? Project.find(params[:projectId]) : nil
    )
    render json: samples.to_json(include: [{ project: { only: [:id, :name] } }])
  end

  def report_v2
    permitted_params = params.permit(:id, :pipeline_version, :background, :skip_cache, :share_id, :merge_nt_nr)
    pipeline_run = select_pipeline_run(@sample, permitted_params[:pipeline_version])
    background_id = get_background_id(@sample, permitted_params[:background], permitted_params[:share_id])
    priority_pathogens = fetch_priority_pathogens()

    editable_sample = current_power.updatable_sample?(@sample)
    annotation_allowed = current_user && current_user.allowed_feature?("annotation")
    show_annotations = editable_sample && annotation_allowed

    if pipeline_run
      # Don't cache the response until all results for the pipeline run are available
      # so the displayed pipeline run status and report hover actions will be updated correctly.
      skip_cache = !pipeline_run.ready_for_cache? ||
                   permitted_params[:skip_cache] ||
                   AppConfigHelper.get_app_config(AppConfig::DISABLE_REPORT_CACHING) ||
                   false

      report_info_params = pipeline_run.report_info_params
      # If the pipeline_version wasn't passed in from the client-side,
      # then set it to version for the selected default pipeline run.
      if permitted_params[:pipeline_version].nil?
        permitted_params[:pipeline_version] = pipeline_run.pipeline_version
      end
      cache_key = PipelineReportService.report_info_cache_key(
        request.path,
        report_info_params
        .merge(background_id: background_id)
        .merge(merge_nt_nr: permitted_params[:merge_nt_nr])
        .symbolize_keys
      )
      httpdate = Time.at(report_info_params[:report_ts]).utc.httpdate

      json =
        fetch_from_or_store_in_cache(skip_cache, cache_key, httpdate) do
          PipelineReportService.call(pipeline_run, background_id, merge_nt_nr: permitted_params[:merge_nt_nr], priority_pathogens: priority_pathogens, show_annotations: show_annotations)
        end
    else
      json = PipelineReportService.call(pipeline_run, background_id, merge_nt_nr: permitted_params[:merge_nt_nr], priority_pathogens: priority_pathogens, show_annotations: show_annotations)
    end
    render json: json
  rescue PipelineReportService::MassNormalizedBackgroundError => e
    render json: { error: e.message }, status: :bad_request
  end

  def amr
    pipeline_run = select_pipeline_run(@sample, params[:pipeline_version])
    amr_counts = nil
    if pipeline_run
      amr_state = pipeline_run.output_states.find_by(output: "amr_counts")
      if amr_state.present? && amr_state.state == PipelineRun::STATUS_LOADED
        amr_counts = pipeline_run.amr_counts
      end
    end
    render json: amr_counts || []
  end

  def save_metadata
    field = params[:field].to_sym
    value = params[:value]
    metadata = { field => value }
    metadata.select! { |k, _v| (Sample::METADATA_FIELDS + [:name]).include?(k) }
    if @sample[field].blank? && value.strip.blank?
      render json: {
        status: "ignored",
      }
    else
      @sample.update!(metadata)
      render json: {
        status: "success",
        message: "Saved successfully",
      }
    end
  rescue StandardError
    error_messages = @sample ? @sample.errors.full_messages : []
    render json: {
      status: 'failed',
      message: 'Unable to update sample',
      errors: error_messages,
    }
  end

  def contig_taxid_list
    pr = select_pipeline_run(@sample, params[:pipeline_version])
    render json: pr.get_taxid_list_with_contigs
  end

  def taxid_contigs_download
    taxid = params[:taxid]
    return if HUMAN_TAX_IDS.include? taxid.to_i

    pr = select_pipeline_run(@sample, params[:pipeline_version])
    contigs = pr.get_contigs_for_taxid(taxid.to_i)
    output_fasta = ''
    contigs.each { |contig| output_fasta += contig.to_fa }
    send_data output_fasta, filename: "#{@sample.name}_tax_#{taxid}_contigs.fasta"
  end

  # GET /samples/:id/taxid_contigs_for_blast.json?taxid=:taxid&pipeline_version=:pipeline_version
  def taxid_contigs_for_blast
    permitted_params = params.permit(:taxid, :pipeline_version)

    taxid = permitted_params[:taxid]
    return if HUMAN_TAX_IDS.include? taxid.to_i

    pr = select_pipeline_run(@sample, permitted_params[:pipeline_version])
    contigs = pr.get_contigs_for_taxid(taxid.to_i, PipelineRun::MIN_CONTIG_READS, "NT")

    order_by = sanitize_order_by(Contig, order_by, :read_count)
    order_dir = sanitize_order_dir(order_dir, :desc)
    # Only return up to the 3 longest contigs
    contigs = contigs.order(Hash[order_by => order_dir]).limit(3)

    formatted_contigs = contigs.reduce([]) do |result, contig|
      result << {}.tap do |formatted_contig|
        formatted_contig[:contig_id] = contig.id
        formatted_contig[:contig_name] = contig.name
        formatted_contig[:num_reads] = contig.read_count

        contig_length = contig.sequence.length
        formatted_contig[:contig_length] = contig_length

        formatted_contig[:fasta_sequence] = if contig_length > Contig::BLAST_SEQUENCE_CHARACTER_LIMIT
                                              contig.fa_header + contig.middle_n_base_pairs(Contig::BLAST_SEQUENCE_CHARACTER_LIMIT)
                                            else
                                              contig.to_fa
                                            end
      end
    end

    response = {
      contigs: formatted_contigs,
    }

    render(
      json: response.to_json,
      status: :ok
    )
  end

  def summary_contig_counts
    pr = select_pipeline_run(@sample, params[:pipeline_version])
    min_contig_reads = params[:min_contig_reads] || PipelineRun::MIN_CONTIG_READS
    contig_counts = pr.get_summary_contig_counts(min_contig_reads)
    render json: { min_contig_reads: min_contig_reads, contig_counts: contig_counts }
  end

  def show_taxid_fasta
    return if HUMAN_TAX_IDS.include? params[:taxid].to_i

    pr = select_pipeline_run(@sample, params[:pipeline_version])
    if params[:hit_type] == "NT_or_NR"
      @taxid_fasta = get_taxon_fasta_from_pipeline_run_combined_nt_nr(pr, params[:taxid], params[:tax_level].to_i)
      if @taxid_fasta.nil?
        @taxid_fasta = "Coming soon" # Temporary fix
      end
    else
      @taxid_fasta = get_taxon_fasta_from_pipeline_run(pr, params[:taxid], params[:tax_level].to_i, params[:hit_type])
    end
    send_data @taxid_fasta, filename: @sample.name + '_' + clean_taxid_name(pr, params[:taxid]) + '-hits.fasta'
  end

  # GET /samples/:id/taxon_five_longest_reads.json?taxid=:taxid&tax_level=:tax_level&pipeline_version=:pipeline_version
  def taxon_five_longest_reads
    permitted_params = params.permit(:taxid, :tax_level, :pipeline_version)

    taxid = permitted_params[:taxid].to_i
    return if HUMAN_TAX_IDS.include? taxid

    pr = select_pipeline_run(@sample, permitted_params[:pipeline_version])
    tax_level = TaxonCount::LEVEL_2_NAME[permitted_params[:tax_level].to_i]
    s3_file_path = pr.five_longest_reads_fasta_s3("nt.#{tax_level}.#{taxid}")

    begin
      five_longest_reads = S3Util.get_s3_file(s3_file_path)
      five_longest_reads_with_headers = five_longest_reads.split(">") # NOTE: This split gets rid of the '>' for each sequence. We must add it back later on.
      # Get rid of empty quotes in the first position of the array
      five_longest_reads_with_headers.shift

      # Calculate shortest and longest alignment reads
      sequence_detector_regex = Regexp.new('\n((.|\n)*)') # Grabs everything after the first new line '\n' is the read sequence. Everything before the first '\n' is the read header.
      reads_without_headers = five_longest_reads_with_headers.map do |read_with_header|
        # Regex match returns an array of two items:
        # The first item contains the sequence with the newline '\n' prepended
        # The second item is the sequence without the newline prepended '\n'
        sequence_detector_regex.match(read_with_header)[1]
      end

      min_alignment_length, max_alignment_length = determine_min_and_max_alignment_lengths(reads_without_headers)

      response = {
        # Need to add back the ">" symbol that signifies the start of a read header
        reads: five_longest_reads_with_headers.map { |r| ">" + r },
        shortestAlignmentLength: min_alignment_length,
        longestAlignmentLength: max_alignment_length,
      }

      render(
        json: response.to_json,
        status: :ok
      )
    rescue StandardError => err
      render(
        json: { error: "An unexpected error has occured", details: err },
        status: :internal_server_error
      )
    end
  end

  def show_taxid_alignment_viz
    @taxon_info = params[:taxon_info].split(".")[0]
    @taxid = @taxon_info.split("_")[2].to_i
    if HUMAN_TAX_IDS.include? @taxid.to_i
      render json: { error: "Human taxon ids are not allowed" }
      return
    end

    pr = select_pipeline_run(@sample, params[:pipeline_version])

    @tax_level = @taxon_info.split("_")[1]
    @taxon_name = taxon_name(@taxid, @tax_level)
    @pipeline_version = pr.pipeline_version if pr

    respond_to do |format|
      format.json do
        s3_file_path = pr.alignment_viz_json_s3(@taxon_info.tr('_', '.'))
        (_tmp1, _tmp2, bucket, key) = s3_file_path.split('/', 4)
        begin
          resp = Client.head_object(bucket: bucket, key: key)
          if resp.content_length < 10_000_000
            alignment_data = JSON.parse(S3Util.get_s3_file(s3_file_path) || "{}")
            flattened_data = {}
            parse_tree(flattened_data, @taxid, alignment_data, true)
            output_array = []
            flattened_data.each do |k, v|
              v["accession"] = k
              v["reads_count"] = v["reads"].size
              output_array << v
            end
            render json: output_array.sort { |a, b| b['reads_count'] <=> a['reads_count'] }
          else
            render json: {
              error: "alignment file too big",
            }
          end
        rescue StandardError
          render json: {
            error: "unexpected error occurred",
          }
        end
      end
      format.html {}
    end
  end

  def contigs_fasta
    pr = select_pipeline_run(@sample, params[:pipeline_version])
    contigs_fasta_s3_path = pr.contigs_fasta_s3_path

    if contigs_fasta_s3_path
      filename = @sample.name + '_contigs.fasta'
      @contigs_fasta_url = get_presigned_s3_url(s3_path: contigs_fasta_s3_path, filename: filename)
      if @contigs_fasta_url
        redirect_to @contigs_fasta_url
      else
        LogUtil.log_error("Contigs fasta file does not exist for sample #{@sample.id}", sample_id: @sample.id)
        render json: {
          error: "contigs fasta file does not exist for this sample",
        }
      end
    else
      render json: {
        error: "contigs fasta file does not exist for this sample",
      }
    end
  end

  def contigs_summary
    pr = select_pipeline_run(@sample, params[:pipeline_version])
    local_file = pr.generate_contig_mapping_table_file

    @contigs_summary = File.read(local_file)
    send_data @contigs_summary, filename: @sample.name + '_contigs_summary.csv'
  end

  def get_s3_file_byterange(s3_path, byterange)
    bucket, key = S3Util.parse_s3_path(s3_path)
    byterange_parts = byterange.split(",")

    # get_object fetches the last byte, so we must subtract one.
    resp = Client.get_object(bucket: bucket, key: key, range: "bytes=#{byterange_parts[0]}-#{byterange_parts[0].to_i + byterange_parts[1].to_i - 1}")

    return resp.body.read
  end

  def contigs_fasta_by_byteranges
    pr = select_pipeline_run(@sample, params[:pipeline_version])
    byteranges = params[:byteranges]

    contig_fasta = pr.contigs_fasta_s3_path

    data = ""

    byteranges.each do |byterange|
      resp =  get_s3_file_byterange(contig_fasta, byterange)
      data += resp
    end

    send_data data, filename: 'contigs.fasta'
  end

  def contigs_sequences_by_byteranges
    pr = select_pipeline_run(@sample, params[:pipeline_version])
    byteranges = params[:byteranges]

    contig_fasta = pr.contigs_fasta_s3_path

    contig_sequences = {}

    byteranges.each do |byterange|
      data = get_s3_file_byterange(contig_fasta, byterange)
      parts = data.split("\n", 2)
      contig_sequences[parts[0]] = parts[1]
    end

    render json: contig_sequences
  end

  def nonhost_fasta
    pr = select_pipeline_run(@sample, params[:pipeline_version])
    filename = @sample.name + '_nonhost.fasta'
    @nonhost_fasta_url = get_presigned_s3_url(s3_path: pr.annotated_fasta_s3_path, filename: filename)
    if @nonhost_fasta_url
      redirect_to @nonhost_fasta_url
    else
      LogUtil.log_error("Nonhost fasta file does not exist for sample #{@sample.id}", sample_id: @sample.id)
      render json: {
        error: "nonhost fasta file does not exist for this sample",
      }
    end
  end

  def unidentified_fasta
    pr = select_pipeline_run(@sample, params[:pipeline_version])
    filename = @sample.name + '_unidentified.fasta'
    @unidentified_fasta_url = get_presigned_s3_url(s3_path: pr.unidentified_fasta_s3_path, filename: filename)
    if @unidentified_fasta_url
      redirect_to @unidentified_fasta_url
    else
      LogUtil.log_error("Unidentified fasta file does not exist for sample #{@sample.id}", sample_id: @sample.id)
      render json: {
        error: "unidentified fasta file does not exist for this sample",
      }
    end
  end

  def raw_results_folder
    # See access check in check_owner
    @file_list = @sample.results_folder_files(params[:pipeline_version])
    @file_path = "#{@sample.sample_path}/results/"
    pipeline_version_url_param = params[:pipeline_version] ? "?pipeline_version=#{params[:pipeline_version]}" : ""
    @sample_path = "#{sample_path(@sample)}#{pipeline_version_url_param}"
    render template: "samples/raw_folder"
  end

  # GET samples/:id/results_folder.json
  def results_folder
    pr = select_pipeline_run(@sample, params[:pipeline_version])
    can_see_stage1_results = (current_user.id == @sample.user_id)
    pipeline_version_url_param = params[:pipeline_version] ? "?pipeline_version=#{params[:pipeline_version]}" : ""
    @exposed_raw_results_url = can_see_stage1_results ? "#{raw_results_folder_sample_url(@sample)}#{pipeline_version_url_param}" : nil
    @sample_path = "#{sample_path(@sample)}#{pipeline_version_url_param}"
    @file_list = []
    if pr
      @file_list = pr.outputs_by_step(can_see_stage1_results)
    end
    @file_path = "#{@sample.sample_path}/results/"
    respond_to do |format|
      format.html do
        render template: "samples/folder"
      end
      format.json do
        render json: { displayedData: @file_list }
      end
    end
  end

  # GET samples/reads_stats.json
  def reads_stats
    queried_sample_ids = (params[:sampleIds] || []).map(&:to_i)

    # No information is returned on samples they don't have access to.
    validated_sample_info = SampleAccessValidationService.call(queried_sample_ids, current_user)
    viewable_samples = validated_sample_info[:viewable_samples]

    results = {}
    if validated_sample_info[:error].nil?
      results = ReadsStatsService.call(viewable_samples)
    else
      raise :internal_server_error
    end

    render json: results
  rescue StandardError => error
    LogUtil.log_error("Error while calling samples/reads_stats.json", exception: error, sample_ids: queried_sample_ids)
    render json: { status: "Internal server error" }, status: :internal_server_error
  end

  def validate_sample_files
    sample_files = params[:sample_files]

    files_valid = []

    if sample_files
      files_valid = sample_files.map do |file|
        !InputFile::FILE_REGEX.match(file).nil?
      end
    end

    render json: files_valid
  end

  # GET /samples/upload
  def upload
    @projects = current_power.updatable_projects
    @host_genomes = host_genomes_list || nil
    @basespace_client_id = ENV["CZID_BASESPACE_CLIENT_ID"] || nil
    @basespace_oauth_redirect_uri = ENV["CZID_BASESPACE_OAUTH_REDIRECT_URI"] || nil
  end

  # GET /samples/1/edit
  def edit
    @project_info = @sample.project || nil
    @host_genomes = host_genomes_list || nil
    @projects = current_power.updatable_projects
    @input_files = @sample.input_files
  end

  # PATCH/PUT /samples/1
  # PATCH/PUT /samples/1.json
  def update
    old_status = @sample.status

    if old_status == Sample::STATUS_CREATED && sample_params[:status] == Sample::STATUS_UPLOADED
      # If any files are not seen on S3, return an error. This is to catch any
      # S3 consistency lag bugs. Web uploader should retry up to
      # MAX_MARK_SAMPLE_RETRIES.
      if @sample.input_files.any? { |f| !f.s3_presence_check }
        render(
          json: { error: "An input file is not yet available on S3" },
          status: :bad_request
        ) and return
      end

      # Unset possible LOCAL_UPLOAD_STALLED
      @sample.update(upload_error: nil) if @sample.upload_error

      MetricUtil.log_analytics_event(
        EventDictionary::SAMPLE_UPLOAD_SUCCEEDED,
        current_user,
        {
          sample_id: @sample.id,
        }
      )
    end

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
    project = @sample.project
    success = @sample.destroy if deletable
    respond_to do |format|
      if success
        format.html { redirect_to project, notice: 'Sample was successfully destroyed.' }
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
      format.html { redirect_to @sample, notice: "Sample is being uploaded if it hasn't been." }
      format.json { head :no_content }
    end
  end

  # PUT /samples/:id/kickoff_pipeline
  def kickoff_pipeline
    @sample.status = Sample::STATUS_RERUN
    @sample.save
    respond_to do |format|
      if !@sample.pipeline_runs.empty?
        format.html { redirect_to pipeline_runs_sample_path(@sample), notice: 'A pipeline run is in progress.' }
        format.json { head :no_content }
      else
        format.html { redirect_to pipeline_runs_sample_path(@sample), notice: 'No pipeline run in progress.' }
        format.json { render json: @sample.errors.full_messages, status: :unprocessable_entity }
      end
    end
  end

  def pipeline_runs
  end

  # POST /samples/:id/kickoff_workflow
  def kickoff_workflow
    workflow = collection_params[:workflow]
    inputs_json = collection_params[:inputs_json].to_json
    @sample.create_and_dispatch_workflow_run(workflow, inputs_json: inputs_json)
    render json: @sample.workflow_runs.non_deprecated.reverse.as_json(
      only: WORKFLOW_RUN_DEFAULT_FIELDS,
      methods: [:input_error, :inputs, :parsed_cached_results]
    )
  end

  def cli_user_instructions
    render template: "samples/cli_user_instructions"
  end

  def coverage_viz_summary
    pr = select_pipeline_run(@sample, params[:pipeline_version])
    coverage_viz_summary_s3_path = pr.coverage_viz_summary_s3_path

    if coverage_viz_summary_s3_path
      @coverage_viz_summary = S3Util.get_s3_file(coverage_viz_summary_s3_path)
      render json: @coverage_viz_summary
    else
      render json: {
        error: "coverage viz summary file does not exist for this sample",
      }
    end
    # For safety.
  rescue StandardError
    render json: {
      error: "There was an error fetching the coverage viz summary file.",
    }
  end

  def coverage_viz_data
    pr = select_pipeline_run(@sample, params[:pipeline_version])
    coverage_viz_data_s3_path = pr.coverage_viz_data_s3_path(params[:accessionId])

    if coverage_viz_data_s3_path
      @coverage_viz_data = S3Util.get_s3_file(coverage_viz_data_s3_path)
      render json: @coverage_viz_data
    else
      render json: {
        error: "coverage viz data file does not exist for this sample and accession id",
      }
    end
    # For safety.
  rescue StandardError
    render json: {
      error: "There was an error fetching the coverage viz data file.",
    }
  end

  # POST /samples/taxa_with_reads_suggestions
  # Get taxon search suggestions, where taxa are restricted to the provided sample ids.
  # Also include, for each taxon, the number of samples that contain reads for the taxon.
  # This method uses POST because hundreds of sampleIds params can be passed.
  def taxa_with_reads_suggestions
    sample_ids = (params[:sampleIds] || []).map(&:to_i)
    query = params[:query]
    samples = current_power.viewable_samples.where(id: sample_ids)

    # User should not be querying for unviewable samples.
    if samples.length != sample_ids.length
      LogUtil.log_error("Get taxa with reads error: Unauthorized access of samples", sample_ids: sample_ids, query: query)
      render json: {
        error: "There was an error fetching the taxa with reads for samples.",
      }, status: :unauthorized
      return
    end

    taxon_list =
      if params[:taxLevel]
        taxon_search(query, [params[:taxLevel]])
      else
        taxon_search(query, ["species", "genus"])
      end
    taxon_list = add_sample_count_to_taxa_with_reads(taxon_list, samples)
    taxon_list = taxon_list.select { |taxon| taxon["sample_count"] > 0 }

    render json: taxon_list
  end

  # POST /samples/taxa_with_contigs_suggestions
  # Get taxon search suggestions, where taxa are restricted to the provided sample ids.
  # Also include, for each taxon, the number of samples that contain contigs for the taxon.
  # This method uses POST because hundreds of sampleIds params can be passed.
  def taxa_with_contigs_suggestions
    sample_ids = (params[:sampleIds] || []).map(&:to_i)
    query = params[:query]
    samples = current_power.viewable_samples.where(id: sample_ids)

    # User should not be querying for unviewable samples.
    if samples.length != sample_ids.length
      LogUtil.log_error("Get taxa with contigs error: Unauthorized access of samples", sample_ids: sample_ids, query: query)
      render json: {
        error: "There was an error fetching the taxa with contigs for samples.",
      }, status: :unauthorized
      return
    end

    taxon_list = taxon_search(query, ["species", "genus"])
    taxon_list = add_sample_count_to_taxa_with_contigs(taxon_list, samples)
    taxon_list = taxon_list.select { |taxon| taxon["sample_count"] > 0 }

    render json: taxon_list
  end

  # POST /samples/uploaded_by_current_user
  # Return whether all sampleIds were uploaded by the current user.
  # This method uses POST because hundreds of sampleIds params can be passed.
  def uploaded_by_current_user
    sample_ids = (params[:sampleIds] || []).map(&:to_i)
    samples = Sample.where(user: current_user, id: sample_ids)

    render json: {
      uploaded_by_current_user: sample_ids.length == samples.length,
    }
  end

  def move_to_project
    @sample.move_to_project(params[:project_id])
    respond_to do |format|
      format.html { redirect_to pipeline_runs_sample_path(@sample), notice: 'Sample Moved' }
      format.json { render :show, status: :ok, location: @sample }
    end
  end

  # Use callbacks to share common setup or constraints between actions.

  private

  def determine_min_and_max_alignment_lengths(sequences)
    sorted_sequences = sequences.map(&:strip).sort_by!(&:length)
    shortest_sequence = sorted_sequences.first
    longest_sequence = sorted_sequences.last

    [shortest_sequence.length, longest_sequence.length]
  end

  def clean_taxid_name(pipeline_run, taxid)
    return 'all' if taxid == 'all'

    taxid_name = pipeline_run.taxon_counts.find_by(tax_id: taxid).name
    return "taxon-#{taxid}" unless taxid_name

    taxid_name.downcase.gsub(/\W/, "-")
  end

  def set_sample
    @sample = samples_scope.find(params[:id])
    assert_access
  rescue ActiveRecord::RecordNotFound
    Rails.logger.error("Sample #{params[:id]} was requested but not in samples_scope")
    render json: { error: "Oh no! This page isn't available." }, status: :not_found
  end

  # Never trust parameters from the scary internet, only allow the white list through.
  def samples_params
    permitted_sample_params = [:name, :project_id, :status, :host_genome_id, :host_genome_name,
                               :basespace_dataset_id, :basespace_access_token, :skip_cache,
                               :do_not_process, :pipeline_execution_strategy, :wetlab_protocol,
                               :share_id, :technology, :medaka_model, :vadr_options, :clearlabs,
                               { workflows: [], input_files_attributes: [:name, :presigned_url, :source_type, :source, :parts, :upload_client] },]
    permitted_sample_params.concat([:pipeline_branch, :dag_vars, :s3_preload_result_path, :alignment_config_name, :subsample, :max_input_fragments]) if current_user.admin?

    new_params = params.permit(samples: permitted_sample_params)
    new_params[:samples] if new_params
  end

  def sample_params
    permitted_params = [:name, :project_name, :project_id, :status, :s3_star_index_path,
                        :s3_bowtie2_index_path, :host_genome_id, :host_genome_name, :sample_notes,
                        :search, :basespace_dataset_id, :basespace_access_token, :client,
                        :do_not_process, :pipeline_execution_strategy, :clearlabs, :technology, :medaka_model, :wetlab_protocol,
                        :share_id,
                        { workflows: [], input_files_attributes: [:name, :presigned_url, :source_type, :source, :parts, :upload_client] },]
    permitted_params.concat([:pipeline_branch, :dag_vars, :s3_preload_result_path, :alignment_config_name, :subsample, :max_input_fragments]) if current_user.admin?
    params.require(:sample).permit(*permitted_params)
  end

  # Doesn't require :sample or :samples
  def collection_params
    permitted_params = [:referenceTree, :workflow, { sampleIds: [], workflowRunIds: [], inputs_json: [:accession_id, :accession_name, :taxon_id, :taxon_name, :technology] }]
    params.permit(*permitted_params)
  end

  def check_owner
    unless current_user.admin? || current_user.id == @sample.user_id
      render json: {
        message: "Only the original uploader can access this.",
      }, status: :unauthorized
      # Rendering halts the filter chain
    end
  end

  def warn_if_large_bulk_upload(samples)
    # NOTE(2021-07-14): We raised this to 400 because users will frequently
    # upload a 384-well plate. CG samples in particular have a lower failure
    # rate than mngs, so this notification is simply an FYI (you'll get failed
    # sample alerts separately).
    if samples.length < 400
      return
    end

    # assume that all samples are in the same project and from the same user
    project = samples.first.project
    uploader = samples.first.user
    msg = "LargeBulkUploadEvent: #{samples.length} samples by #{uploader.role_name}." \
    " See: #{project.status_url}"
    Rails.logger.info(msg)
  rescue StandardError => e
    # catch all errors because we don't want to ever block uploads
    LogUtil.log_error(
      "warn_if_large_bulk_upload: #{e}",
      exception: e,
      project: project,
      uploader: uploader,
      samples_count: samples.length
    )
  end

  def fetch_priority_pathogens
    if current_user && current_user.allowed_feature?("pathogen_label_v0")
      pathogen_list_version = PathogenList.find_by(is_global: true).fetch_list_version()
      { "knownPathogen" => pathogen_list_version.fetch_pathogen_names() }
    else
      TaxonLineage::PRIORITY_PATHOGENS
    end
  end
end
