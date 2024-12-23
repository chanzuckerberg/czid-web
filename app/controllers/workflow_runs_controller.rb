class WorkflowRunsController < ApplicationController
  include SamplesHelper
  include ParameterSanitization
  include PipelineOutputsHelper

  before_action :set_workflow_run, only: [:show, :results, :zip_link, :amr_report_downloads, :amr_gene_level_downloads, :cg_report_downloads, :benchmark_report_downloads]
  before_action :admin_required, only: [:rerun]

  MAX_PAGE_SIZE = 100
  CLADE_FASTA_S3_KEY = "clade_exports/fastas/temp-%{path}".freeze
  CLADE_REFERENCE_TREE_S3_KEY = "clade_exports/trees/temp-%{path}".freeze
  CLADE_EXTERNAL_SITE = "clades.nextstrain.org".freeze

  def index
    permitted_params = index_params

    filters = permitted_params.slice(:search, :host, :locationV2, :tissue, :projectId, :visibility, :time, :workflow, :taxon, :sampleIds, :workflowRunIds)
    domain = permitted_params[:domain]
    workflow_runs = fetch_workflow_runs(domain: domain, filters: filters)

    sorting_v0_allowed = current_user.allowed_feature?("sorting_v0_admin") ||
                         (current_user.allowed_feature?("sorting_v0") && domain == "my_data")

    order_by = if sorting_v0_allowed
                 permitted_params[:orderBy] || "createdAt"
               else
                 :id
               end
    order_dir = sanitize_order_dir(permitted_params[:orderDir], :desc)

    workflow_runs = if sorting_v0_allowed
                      WorkflowRun.sort_workflow_runs(workflow_runs, order_by, order_dir)
                    else
                      workflow_runs.order(Hash[order_by => order_dir])
                    end

    paginated_workflow_runs = paginate_workflow_runs(
      workflow_runs: workflow_runs,
      offset: permitted_params[:offset] ? permitted_params[:offset].to_i : 0,
      limit: permitted_params[:limit] ? permitted_params[:limit].to_i : WorkflowRunsController::MAX_PAGE_SIZE
    )

    formatted_workflow_runs = format_workflow_runs(workflow_runs: paginated_workflow_runs, mode: permitted_params[:mode] || "basic")
    should_list_all_workflow_run_ids = ActiveModel::Type::Boolean.new.cast(permitted_params[:listAllIds])

    response = {}.tap do |resp|
      resp[:workflow_runs] = formatted_workflow_runs
      resp[:all_workflow_run_ids] = workflow_runs.pluck(:id) if should_list_all_workflow_run_ids
    end

    render(
      json: response.to_json,
      status: :ok
    )
  end

  def show
    render(
      json: @workflow_run.as_json,
      status: :ok
    )
  end

  def results
    render(
      json: @workflow_run.results,
      status: :ok
    )
  rescue NameError
    render(
      json: { status: "Workflow Run action not supported" },
      status: :not_found
    )
  end

  def rerun
    wr_id = params[:id]
    if StringUtil.integer?(wr_id)
      set_workflow_run
      @workflow_run.rerun
    else
      # Workflow run is UUID, call Nextgen service
      WorkflowRunRerunService.call(current_user.id, wr_id)
    end
    render json: { status: "success" }, status: :ok
  rescue StandardError => e
    LogUtil.log_error("Rerun trigger failed", exception: e, workflow_id: wr_id)
    render json: {
      status: "error",
      message: e.message,
    }, status: :ok
  end

  # POST /workflow_runs/validate_workflow_run_ids
  #
  # Validate access to workflow_run ids, and that the workflow_runs
  # have completed and succeeded processing.
  # Filters out workflow_runs that the user does not have read access to or are deprecated.
  #
  # Returns a list of valid workflow_run ids and the names of the samples that the workflow_runs the
  # user does not have access to
  #
  # This is a POST route and not a GET request because Puma does not allow
  # query strings longer than a certain amount (1024 * 10 chars), which causes
  # trouble when a large amount of workflow run ids are specified.
  def validate_workflow_run_ids
    permitted_params = params.permit(:workflow, workflowRunIds: [])

    validated_workflow_runs_info = WorkflowRunValidationService.call(query_ids: permitted_params[:workflowRunIds], current_user: current_user)
    viewable_workflow_runs = validated_workflow_runs_info[:viewable_workflow_runs]

    if validated_workflow_runs_info[:error].nil?
      valid_workflow_run_ids = viewable_workflow_runs.by_workflow(permitted_params[:workflow]).active.pluck(:id)
      invalid_workflow_runs = viewable_workflow_runs.reject { |wr| valid_workflow_run_ids.include?(wr.id) }

      invalid_sample_ids = invalid_workflow_runs.map(&:sample_id).uniq
      invalid_sample_names = current_power.samples.where(id: invalid_sample_ids).pluck(:name)

      render(
        json: {
          validIds: valid_workflow_run_ids,
          invalidSampleNames: invalid_sample_names,
          error: nil,
        },
        status: :ok
      )
    else
      render(
        json: {
          validWorkflowRunIds: [],
          invalidSampleNames: [],
          error: validated_workflow_runs_info[:error],
        },
        status: :ok
      )
    end
  end

  # POST /workflow_runs/valid_consensus_genome_workflow_runs
  # Returns a list of workflow_run that the user has access to.
  # For each workflow_run, returns the id, owner and status.
  # We are adding this - TEMPORARY - endpoint to facilitate moving to NextGen
  # This method uses POST because hundreds of workflowRunIds can be passed.
  def valid_consensus_genome_workflow_runs
    permitted_params = params.permit(workflowRunIds: [])
    workflow = WorkflowRun::WORKFLOW[:consensus_genome]

    validated_workflow_runs_info = WorkflowRunValidationService.call(query_ids: permitted_params[:workflowRunIds], current_user: current_user)
    viewable_workflow_runs = validated_workflow_runs_info[:viewable_workflow_runs]

    if validated_workflow_runs_info[:error].nil?
      valid_workflow_run_fields = viewable_workflow_runs.by_workflow(workflow).non_deprecated.pluck(:id, :user_id, :status).map { |wr| { id: wr[0], owner_user_id: wr[1], status: wr[2] } }

      render(
        json: {
          workflowRuns: valid_workflow_run_fields,
          error: nil,
        },
        status: :ok
      )
    else
      render(
        json: {
          workflowRuns: [],
          error: validated_workflow_runs_info[:error],
        },
        status: :ok
      )
    end
  end

  # POST /workflow_runs/workflow_runs_info
  # Returns sample and taxon information for the given workflow runs.
  # This method uses POST because hundreds of workflowRunIds can be passed.
  def workflow_runs_info
    permitted_params = params.permit(workflowRunIds: [])
    workflow_run_ids = permitted_params[:workflowRunIds]

    workflow_run_info = current_power.workflow_runs.joins(:sample).select(
      "samples.project_id as project_id,
      samples.name as name,
      samples.user_id as user_id,
      workflow_runs.id as id,
      workflow_runs.inputs_json"
    )
                                     .where(id: workflow_run_ids).map do |workflow_run|
      { id: workflow_run.id,
        name: workflow_run.name,
        projectId: workflow_run.project_id,
        taxonName: JSON.parse(workflow_run.inputs_json)["taxon_name"],
        creationSource: JSON.parse(workflow_run.inputs_json)["creation_source"],
        userId: workflow_run.user_id, }
    end

    render(
      json: {
        workflowRunInfo: workflow_run_info,
      },
      status: :ok
    )
  end

  # POST /workflow_runs/metadata_fields
  def metadata_fields
    permitted_params = params.permit(workflowRunIds: [])
    workflow_run_ids = permitted_params[:workflowRunIds]
    sample_ids = current_power.workflow_runs.where(id: workflow_run_ids).pluck(:sample_id).uniq

    samples = current_power.viewable_samples.where(id: sample_ids)
    results = MetadataField.by_samples(samples)

    render json: results
  end

  # POST /workflow_runs/created_by_current_user
  # Returns whether all workflow runs were created by the current user.
  # This method uses POST because hundreds of workflowRunIds can be passed.
  def created_by_current_user
    permitted_params = params.permit(workflowRunIds: [])
    workflow_runs = current_power.workflow_runs.created_by(current_user).where(id: permitted_params[:workflowRunIds])

    render(
      json: {
        created_by_current_user: permitted_params[:workflowRunIds].length == workflow_runs.length,
      },
      status: :ok
    )
  end

  # Top-level zipped pipeline results
  def zip_link
    path = @workflow_run.zip_link
    if path
      redirect_to path
    else
      render(
        json: { status: "Output not available" },
        status: :not_found
      )
    end
  end

  # POST /workflow_runs/consensus_genome_clade_export
  # Generates a link that allows the exportation of consensus genomes to Nextclade.
  # TODO: If more Consensus Genome specific controller methods are needed in the future,
  # export to a new ConsensusGenomeWorkflowRunsController.
  def consensus_genome_clade_export
    permitted_params = params.permit(:referenceTree, workflowRunIds: [])
    workflow_run_ids = permitted_params[:workflowRunIds]
    workflow_runs = current_power.workflow_runs.where(id: workflow_run_ids).consensus_genomes.active

    # Remove the line below if generalizing beyond SARS-CoV-2
    workflow_runs = workflow_runs.select { |wr| wr.get_input("accession_id") == ConsensusGenomeWorkflowRun::SARS_COV_2_ACCESSION_ID }
    workflow_run_ids = workflow_runs.pluck(:id)

    if workflow_run_ids.empty?
      render(
        json: { status: "No valid WorkflowRuns" },
        status: :bad_request
      ) and return
    end

    # Concatenate the fastas, upload to S3, and generate a presigned link.
    content = ConsensusGenomeConcatService.call(workflow_run_ids)
    key = format(CLADE_FASTA_S3_KEY, path: SecureRandom.alphanumeric(5))
    S3Util.upload_to_s3(SAMPLES_BUCKET_NAME, key, content)
    fasta_url = get_presigned_s3_url(bucket_name: SAMPLES_BUCKET_NAME, key: key, duration: 300)

    # Generate the external URL.
    options = { "input-fasta": fasta_url, "dataset-name": "sars-cov-2" }
    # If a reference tree file was provided, upload to s3 and generate a presigned link.
    if permitted_params[:referenceTree].present?
      tree_key = format(CLADE_REFERENCE_TREE_S3_KEY, path: SecureRandom.alphanumeric(5))
      tree_contents = permitted_params[:referenceTree]
      S3Util.upload_to_s3(SAMPLES_BUCKET_NAME, tree_key, tree_contents)
      tree_url = get_presigned_s3_url(bucket_name: SAMPLES_BUCKET_NAME, key: tree_key, duration: 300)
      options["input-tree"] = tree_url
    end
    external_url = URI::HTTPS.build(host: CLADE_EXTERNAL_SITE, query: options.to_query)

    # Ensure data export is logged and attributed.
    event_name = "WorkflowRunsController_clade_exported"
    MetricUtil.log_analytics_event(event_name, current_user, { sample_ids: workflow_runs&.pluck(:sample_id)&.uniq || [], workflow_run_ids: workflow_run_ids || [] }, request)
    Rails.logger.info("#{event_name} by user #{current_user.id} for workflow runs (#{workflow_run_ids})")

    # We call JSON.generate explicitly here so that "&input-tree=" doesn't get
    # encoded into "\u0026input-tree=" by .to_json.
    render(
      json: JSON.generate({ external_url: external_url }),
      status: :ok
    )
  rescue StandardError => e
    message = "Unexpected error in clade export generation"
    LogUtil.log_error(message, exception: e, workflow_run_ids: workflow_run_ids)
    render(
      json: { status: message },
      status: :internal_server_error
    )
  end

  # AMR pipeline outputs that are available for download directly from the AMR sample report
  def amr_report_downloads
    permitted_params = params.permit(:downloadType)
    download_type = permitted_params[:downloadType]
    sample_name = @workflow_run.sample.name

    case download_type
    when "comprehensive_amr_metrics_tsv"
      s3_path = @workflow_run.output_path(@workflow_run.workflow_by_class.class::OUTPUT_COMPREHENSIVE_AMR_METRICS_TSV)
      filename = "comprehensive_amr_metrics.tsv"
    when "non_host_reads"
      s3_path = @workflow_run.output_path(@workflow_run.workflow_by_class.class::OUTPUT_NON_HOST_READS)
      filename = "non_host_reads.fasta"
    when "non_host_contigs"
      s3_path = @workflow_run.output_path(@workflow_run.workflow_by_class.class::OUTPUT_NON_HOST_CONTIGS)
      filename = "contigs.fasta"
    when "zip_link"
      s3_path = @workflow_run.output_path(@workflow_run.workflow_by_class.class::OUTPUT_ZIP)
      filename = "outputs.zip"
    when "report_csv"
      send_data AmrReportDataService.call(@workflow_run, csv: true), filename: @workflow_run.sample.name + '_report.csv'
      return
    else
      render(
        json: { status: "Output not found" },
        status: :not_found
      )
    end

    if s3_path.present? && filename.present?
      presigned_url = get_presigned_s3_url(s3_path: s3_path, filename: "#{sample_name}_#{@workflow_run.id}_#{filename}")

      if presigned_url
        redirect_to presigned_url
      else
        render(
          json: { status: "Output not available" },
          status: :not_found
        )
      end
    end
  end

  def benchmark_report_downloads
    permitted_params = params.permit(:downloadType)
    download_type = permitted_params[:downloadType]
    sample_name = @workflow_run.sample.name
    @workflow_run = @workflow_run.workflow_by_class

    case download_type
    when "report_html"
      output_name = @workflow_run.get_output_name(BenchmarkWorkflowRun::OUTPUT_BENCHMARK_HTML_TEMPLATE)
      s3_path = @workflow_run.output_path(output_name)
      filename = "benchmark.html"
    when "report_ipynb"
      output_name = @workflow_run.get_output_name(BenchmarkWorkflowRun::OUTPUT_BENCHMARK_NOTEBOOK)
      s3_path = @workflow_run.output_path(output_name)
      filename = "benchmark_notebook.ipynb"
    else
      render(
        json: { status: "Output not found" },
        status: :not_found
      )
    end

    if s3_path.present? && filename.present?
      presigned_url = get_presigned_s3_url(s3_path: s3_path, filename: "#{sample_name}_#{@workflow_run.id}_#{filename}")

      if presigned_url
        redirect_to presigned_url
      else
        render(
          json: { status: "Output not available" },
          status: :not_found
        )
      end
    end
  end

  def amr_gene_level_downloads
    permitted_params = params.permit(:downloadType, :indexId, :geneName)
    download_type = permitted_params[:downloadType]
    # index_id is a gene id for reads and an ARO accession for contigs
    index_id = permitted_params[:indexId]
    gene_name = permitted_params[:geneName]
    case download_type
    when "download-contigs"
      file = @workflow_run.download_gene_level_contigs(index_id)
    when "download-reads"
      file = @workflow_run.download_gene_level_reads(index_id)
    else
      render(
        json: { status: "Output not found" },
        status: :not_found
      )
    end
    send_file(file, filename: "amr-#{download_type}-#{gene_name}.fasta")
  end

  def cg_report_downloads
    permitted_params = params.permit(:downloadType)
    download_type = permitted_params[:downloadType]
    sample_name = @workflow_run.sample.name

    case download_type
    when "ref_fasta"
      s3_path = @workflow_run.sample.input_files.reference_sequence[0]&.s3_path
      filename = @workflow_run.inputs&.[]("ref_fasta")
    else
      render(
        json: { status: "File not found" },
        status: :not_found
      ) and return

    end

    presigned_url = nil
    if s3_path.present? && filename.present?
      presigned_url = get_presigned_s3_url(s3_path: s3_path, filename: "#{sample_name}_#{@workflow_run.id}_#{filename}")
    end

    render(
      json: {
        url: presigned_url,
      },
      status: :ok
    )
  end

  private

  def set_workflow_run
    workflow_run = current_power.workflow_runs.find(params[:id])
    workflow_class = WorkflowRun::WORKFLOW_CLASS[workflow_run.workflow]
    @workflow_run = workflow_class ? workflow_run.becomes(workflow_class) : workflow_run
  rescue ActiveRecord::RecordNotFound
    @workflow_run = nil
    render(
      json: { status: "Workflow Run not found" },
      status: :not_found
    )
  end

  def index_params
    params.permit(:domain, :mode, :offset, :limit, :orderBy, :orderDir, :listAllIds, :search, :projectId, :visibility, :workflow, host: [], time: [], locationV2: [], tissue: [], taxon: [], sampleIds: [], workflowRunIds: [])
  end

  def fetch_workflow_runs(domain:, filters: {})
    sample_filters = filters.slice(:search, :host, :locationV2, :tissue, :projectId, :visibility, :sampleIds)
    workflow_run_filters = filters.slice(:workflow, :time, :taxon, :workflowRunIds)

    samples = fetch_samples(domain: domain, filters: sample_filters)
    samples_workflow_runs = current_power.samples_workflow_runs(samples).non_deprecated.non_deleted

    filter_workflow_runs(workflow_runs: samples_workflow_runs, filters: workflow_run_filters)
  end

  def format_workflow_runs(workflow_runs:, mode: "basic")
    return [] if workflow_runs.empty?

    should_include_sample_info = mode == "with_sample_info"
    if should_include_sample_info
      sample_ids = workflow_runs.pluck(:sample_id).uniq
      sample_attributes = [:id, :created_at, :host_genome_name, :name, :private_until, :project_id, :sample_notes]
      metadata_by_sample_id = Metadatum.by_sample_ids(sample_ids)
      samples_visibility_by_sample_id = get_visibility_by_sample_id(sample_ids)
      workflow_runs = workflow_runs.includes(:user, sample: [:host_genome, :project, :user])
    else
      workflow_runs = workflow_runs.includes(:user)
    end

    formatted_workflow_runs = workflow_runs.reduce([]) do |formatted_wrs, wr|
      formatted_wrs << {}.tap do |formatted_wr|
        formatted_wr[:id] = wr.id
        formatted_wr[:workflow] = wr.workflow
        formatted_wr[:runner] = {
          name: wr&.user&.name,
          id: wr&.user_id,
        }
        formatted_wr[:wdl_version] = wr.wdl_version
        formatted_wr[:created_at] = wr.created_at
        formatted_wr[:status] = WorkflowRun::SFN_STATUS_MAPPING[wr.status]
        formatted_wr[:cached_results] = wr.parsed_cached_results

        formatted_wr[:inputs] = {}.tap do |wr_info|
          if wr.workflow == WorkflowRun::WORKFLOW[:consensus_genome]
            wr_inputs = ["accession_id", "accession_name", "medaka_model", "taxon_name", "technology", "wetlab_protocol", "ref_fasta", "primer_bed", "creation_source"].index_with { |i| wr.get_input(i) }
            wr_inputs["taxon_name"] = TaxonLineage.where(taxid: wr.get_input("taxon_id")).order(:version_start).last&.tax_name
            wr_info.merge!(wr_inputs)
            wr_info[:technology] = ConsensusGenomeWorkflowRun::TECHNOLOGY_NAME[wr_inputs["technology"]]&.capitalize
          end
        end

        formatted_wr[:sample] = {}.tap do |formatted_sample|
          if should_include_sample_info
            wr_sample = wr.sample
            formatted_sample[:info] = wr_sample.slice(sample_attributes)
            formatted_sample[:info][:public] = samples_visibility_by_sample_id[wr_sample.id]
            result_status_description = get_result_status_description_for_errored_sample(wr_sample) if wr_sample.upload_error.present?
            formatted_sample[:info].merge!(result_status_description) if result_status_description.present?
            formatted_sample[:metadata] = metadata_by_sample_id[wr_sample.id]
            formatted_sample[:project_name] = wr_sample.project.name
            formatted_sample[:uploader] = sample_uploader(wr_sample)
          else
            formatted_sample[:info] = { id: wr.sample_id }
          end
        end
      end
    end

    formatted_workflow_runs
  end

  def filter_workflow_runs(workflow_runs:, filters: {})
    if filters.present?
      time = filters[:time]
      workflow = filters[:workflow]
      taxon_id = filters[:taxon]
      workflow_run_ids = filters[:workflowRunIds]

      workflow_runs = workflow_runs.where(id: workflow_run_ids) if workflow_run_ids.present?
      workflow_runs = workflow_runs.by_time(start_date: Date.parse(time[0]), end_date: Date.parse(time[1])) if time.present?
      workflow_runs = workflow_runs.by_workflow(workflow) if workflow.present?
      # At the moment, filtering workflows by taxon is only supported for consensus genome
      workflow_runs = workflow_runs.by_taxon(taxon_id) if taxon_id.present? && workflow == WorkflowRun::WORKFLOW[:consensus_genome]
    end

    workflow_runs
  end

  def paginate_workflow_runs(workflow_runs:, offset: 0, limit: WorkflowRunsController::MAX_PAGE_SIZE)
    workflow_runs.offset(offset).limit(limit)
  end
end
