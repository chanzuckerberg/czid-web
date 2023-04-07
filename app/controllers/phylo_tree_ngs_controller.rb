class PhyloTreeNgsController < ApplicationController
  include ElasticsearchHelper
  include ParameterSanitization
  include PipelineOutputsHelper

  ########################################
  # Current logic for phylo_tree permissions:
  # 1. index/show permissions are based on viewability of all the samples
  #    that make up the tree.
  # 2. create/edit permissions are based on
  #    a. viewability of all the samples
  #    b. the project the tree belongs to
  #       (if 2 users belong to the same project, they are considered
  #        collaborators and so they can both create/edit trees for the project).
  # While project membership is used to confer create/edit permission,
  # trees created for a project may in fact contain samples from outside
  # the project. Such trees will be hidden from members of the project that do not
  # have read access to all those samples.
  ########################################

  before_action :admin_required, only: [:rerun]
  before_action :set_phylo_tree, only: [:show, :download]

  # Carried over from PhyloTreesController:
  # This limit determines how many rows can be displayed in "additional samples".
  # This limit was added because the phylo tree creation was timing out for admins
  # and otherwise the results will grow without bound per user.
  ELIGIBLE_PIPELINE_RUNS_LIMIT = 1000
  PIPELINE_RUN_IDS_WITH_TAXID_LIMIT = 10_000

  # GET /phylo_tree_ngs
  def index
    permitted_params = index_params
    tax_id = permitted_params[:taxId]&.to_i
    project_id = permitted_params[:projectId]

    if ApplicationHelper::HUMAN_TAX_IDS.include? tax_id
      render json: { message: "Human taxon ids are not allowed" }, status: :forbidden
    else
      phylo_tree_ngs = fetch_phylo_tree_ngs(filters: permitted_params.slice(:taxId, :projectId))
      phylo_tree_ngs = format_phylo_tree_ngs(phylo_tree_ngs: phylo_tree_ngs, mode: "basic")

      project = current_power.projects.find(project_id) if project_id.present?
      taxon_name = TaxonLineage.where(taxid: tax_id).last.name if tax_id.present?

      respond_to do |format|
        format.html
        format.json do
          render json: {
            project: project,
            taxonName: taxon_name,
            phyloTrees: phylo_tree_ngs,
          }
        end
      end
    end
  end

  # GET /phylo_tree_ngs/:id
  def show
    respond_to do |format|
      format.html do
        # This sends it to DiscoveryViewRouter. See app/views/home/my_data.html.erb.
        render 'home/my_data'
      end

      format.json do
        if current_user.admin?
          pt = @phylo_tree_ng.as_json
          pt["log_url"] = AwsUtil.get_sfn_execution_url(@phylo_tree_ng.sfn_execution_arn)
        else
          pt = @phylo_tree_ng.as_json(only: ["id", "name", "tax_id", "status"])
        end

        taxon_lineage = TaxonLineage.where(taxid: pt["tax_id"]).last
        pt["tax_name"] = taxon_lineage.tax_name
        pt["nextGeneration"] = true

        # If the tree didn't succeed, everything below the next block is not
        # used for display:
        if @phylo_tree_ng.status != WorkflowRun::STATUS[:succeeded]
          render json: pt and return
        end

        pipeline_runs = @phylo_tree_ng.pipeline_runs
        pr_to_coverage_breadth = get_coverage_breadth_for_pipeline_runs(pipeline_runs, pt["tax_id"])

        begin
          results = @phylo_tree_ng.results
          pt["user"] = @phylo_tree_ng.user.name
          pt["tax_level"] = TaxonCount.find_by(tax_id: pt["tax_id"]).tax_level
          pt["parent_taxid"] = taxon_lineage.genus_taxid if pt["tax_level"] == 1
          pt["newick"] = results[:newick]

          # Populate metadata and metrics for sample nodes
          metadata_by_sample_id = Metadatum.by_sample_ids(pipeline_runs.pluck(:sample_id).uniq, use_raw_date_strings: true)
          nodes = pipeline_runs.joins(sample: [:project, :host_genome]).select(
            "pipeline_runs.id, samples.id as sample_id," \
            "samples.name, projects.name as project_name," \
            "host_genomes.name as host_genome_name"
          ).as_json.each_with_object({}) do |pr, result|
            result[pr["name"]] = {
              pipeline_run_id: pr["id"],
              sample_id: pr["sample_id"],
              name: pr["name"],
              project_name: pr["project_name"],
              host_genome_name: pr["host_genome_name"],
              metadata: metadata_by_sample_id[pr["sample_id"]],
              coverage_breadth: pr_to_coverage_breadth[pr["id"]] || nil,
            }
          end

          # Populate metadata for NCBI nodes
          ncbi_metadata = JSON.parse(results[:ncbi_metadata] || "{}")
          ncbi_metadata.each do |node_id, node_metadata|
            nodes[node_id] = node_metadata
            nodes[node_id]["name"] ||= node_metadata["accession"]
            nodes[node_id]["accession"] = node_id
          end

          pt["sampleDetailsByNodeName"] = nodes
        rescue SfnExecution::OutputNotFoundError
          # If the samples were too divergent to produce a phylo tree, the
          # newick tree output will be missing, so return a url to the
          # clustermap to display instead. We use "image/svg+xml" to override S3
          # default "binary/octet-stream" for SVGs.
          pt["clustermap_svg_url"] = get_presigned_s3_url(s3_path: @phylo_tree_ng.output_path(PhyloTreeNg::OUTPUT_CLUSTERMAP_SVG), content_type: "image/svg+xml")

          # Check if the any of the samples had low coverage (coverage breadth < 25%).
          pt["has_low_coverage"] = pr_to_coverage_breadth.values.any? { |coverage| coverage.present? && coverage < 0.25 }
        end

        render json: pt
      end
    end
  end

  # GET /phylo_tree_ngs/new_pr_ids
  def new_pr_ids
    permitted_params = new_params
    get_additonal_samples = ActiveModel::Type::Boolean.new.cast(permitted_params[:getAdditionalSamples])
    tax_id = permitted_params[:taxId]&.to_i
    project_id = permitted_params[:projectId]&.to_i
    filter = permitted_params[:filter].present? ? "%" + permitted_params[:filter] + "%" : nil

    if ApplicationHelper::HUMAN_TAX_IDS.include? tax_id
      render json: { message: "Human taxon ids are not allowed" }, status: :forbidden
      return
    end

    tax_level = TaxonLineage.where(taxid: tax_id).last.tax_level
    # Return runs that are not from the specified project
    if get_additonal_samples
      # Fetch the top (non-deprecated) pipeline runs that the user has access to.
      # If the user has typed a search term, filter the results.
      eligible_pipeline_runs = if filter.present?
                                 current_power.pipeline_runs.joins(sample: [:project, :host_genome, :metadata]).where.not(samples: { project_id: project_id }).where(
                                   "pipeline_runs.id in (select max(id) from pipeline_runs where job_status = 'CHECKED' and sample_id in (select id from samples) group by sample_id)"
                                 ).where(
                                   "(projects.name like :filter)
          or (samples.name like :filter)
          or (host_genomes.name like :filter)
          or (metadata.key = 'sample_type' and metadata.string_validated_value like :filter)
          or (metadata.key = 'collection_location_v2' and metadata.string_validated_value like :filter)
          ",
                                   filter: filter
                                 )
                               else
                                 current_power.pipeline_runs.joins(sample: [:project])
                                              .where.not(samples: { project_id: project_id })
                                              .where("pipeline_runs.id in (select max(id) from pipeline_runs where job_status = 'CHECKED' and sample_id in (select id from samples) group by sample_id)")
                               end

      eligible_pipeline_run_ids = eligible_pipeline_runs.non_deleted.pluck(:id)
      # If there are no runs of interest, return an empty list.
      if eligible_pipeline_run_ids.empty?
        render json: {
          pipelineRunIds: [],
          coverageBreadths: {},
        }
        return
      end

      run_ids_string = eligible_pipeline_run_ids.to_set.to_a.join(',')

      # Get all pipeline_run_ids with at least one contig.
      query = if tax_level == TaxonCount::TAX_LEVEL_SPECIES
                "SELECT pipeline_run_id FROM contigs WHERE species_taxid_nt = #{tax_id} AND pipeline_run_id IN (#{run_ids_string})
                UNION SELECT pipeline_run_id FROM contigs WHERE species_taxid_nr = #{tax_id} AND pipeline_run_id IN (#{run_ids_string});"
              else
                "SELECT pipeline_run_id FROM contigs WHERE genus_taxid_nt = #{tax_id} AND pipeline_run_id IN (#{run_ids_string})
                UNION SELECT pipeline_run_id FROM contigs WHERE genus_taxid_nr = #{tax_id} AND pipeline_run_id IN (#{run_ids_string});"
              end

      pipeline_run_ids_with_taxid = Contig.connection.select_all(ActiveRecord::Base.sanitize_sql_array([query])).pluck("pipeline_run_id")

      render json: {
        pipelineRunIds: pipeline_run_ids_with_taxid,
        # We need to know the coverage breadth of runs to determine whether or not to display a low coverage warning.
        coverageBreadths: get_coverage_breadth_for_pipeline_runs(PipelineRun.where(id: pipeline_run_ids_with_taxid), tax_id, true),
      }
    else
      project_pipeline_run_ids_with_taxid = TaxonByterange.joins(pipeline_run: [{ sample: :project }]).where(taxid: tax_id, samples: { project_id: project_id }).pluck(:pipeline_run_id)
      top_project_pipeline_runs_with_taxid = current_power.pipeline_runs.where(id: project_pipeline_run_ids_with_taxid).non_deleted.top_completed_runs
      top_project_pipeline_runs_ids = top_project_pipeline_runs_with_taxid.pluck(:id)
      # If there are no runs of interest, return an empty list.
      if top_project_pipeline_runs_ids.empty?
        render json: {
          pipelineRunIds: [],
          coverageBreadths: {},
          runsWithContigs: [],
        }
        return
      end

      # Get the ids of the runs with contigs for the specified taxon;
      # we only allow users to select runs with at least one contig for the phylo tree,
      # even though we display all runs in their selected project.
      run_ids_string = top_project_pipeline_runs_ids.to_set.to_a.join(',')
      query = if tax_level == TaxonCount::TAX_LEVEL_SPECIES
                "SELECT pipeline_run_id FROM contigs WHERE species_taxid_nt = #{tax_id} AND pipeline_run_id IN (#{run_ids_string})
        UNION SELECT pipeline_run_id FROM contigs WHERE species_taxid_nr = #{tax_id} AND pipeline_run_id IN (#{run_ids_string});"
              else
                "SELECT pipeline_run_id FROM contigs WHERE genus_taxid_nt = #{tax_id} AND pipeline_run_id IN (#{run_ids_string})
        UNION SELECT pipeline_run_id FROM contigs WHERE genus_taxid_nr = #{tax_id} AND pipeline_run_id IN (#{run_ids_string});"
              end

      pipeline_runs_with_contigs = Contig.connection.select_all(ActiveRecord::Base.sanitize_sql_array([query])).pluck("pipeline_run_id")

      render json: {
        pipelineRunIds: top_project_pipeline_runs_ids,
        # We need to know the coverage breadth of runs to determine whether or not to display a low coverage warning.
        coverageBreadths: get_coverage_breadth_for_pipeline_runs(top_project_pipeline_runs_with_taxid, tax_id, true),
        # We need a list of runs with contigs since we only allow users to select runs with at least one contig.
        runsWithContigs: pipeline_runs_with_contigs,
      }
    end
  end

  # GET /phylo_tree_ngs/new_pr_info
  def new_pr_info
    permitted_params = new_params
    get_additonal_samples = ActiveModel::Type::Boolean.new.cast(permitted_params[:getAdditionalSamples])
    pipeline_run_ids = permitted_params[:pipelineRunIds]
    tax_id = permitted_params[:taxId]&.to_i

    if get_additonal_samples
      additional_samples = sample_details_json(pipeline_run_ids, tax_id, contigs_only: true)

      render json: {
        samples: additional_samples,
      }
    else
      project_samples = sample_details_json(pipeline_run_ids, tax_id, contigs_only: false)

      render json: {
        samples: project_samples,
      }
    end
  end

  # POST /phylo_tree_ngs
  def create
    permitted_params = create_params
    pipeline_run_ids = permitted_params[:pipelineRunIds].map(&:to_i)
    project_id = permitted_params[:projectId]&.to_i
    tax_id = permitted_params[:taxId]&.to_i

    if ApplicationHelper::HUMAN_TAX_IDS.include? tax_id
      render json: { message: "Human taxon ids are not allowed" }, status: :forbidden
      return
    end

    superkingdom_name = TaxonLineage.where(taxid: tax_id).last.superkingdom_name.downcase

    project = current_power.updatable_projects.find(project_id)
    non_viewable_pipeline_run_ids = pipeline_run_ids.to_set - current_power.pipeline_runs.pluck(:id).to_set
    if !non_viewable_pipeline_run_ids.empty?
      render json: { message: "You are not authorized to view all pipeline runs in the list." }, status: :unauthorized
    else
      additional_reference_accession_ids = get_additional_reference_accession_ids(pipeline_run_ids, tax_id)
      phylo_tree = PhyloTreeNg.new(
        inputs_json: {
          additional_reference_accession_ids: additional_reference_accession_ids,
          tax_id: tax_id,
          superkingdom_name: superkingdom_name,
          pipeline_run_ids: pipeline_run_ids,
        },
        name: sanitize_title_name(permitted_params[:name]),
        pipeline_runs: PipelineRun.where(id: pipeline_run_ids),
        project_id: project.id,
        user_id: current_user.id
      )
      begin
        phylo_tree.save!
        phylo_tree.dispatch
        render json: { status: :ok, message: "tree creation job submitted", phylo_tree_id: phylo_tree.id }
      rescue StandardError => e
        LogUtil.log_error("PhyloTreeNgFailedEvent: Phylo Tree by #{current_user.role_name} failed to save.", exception: e)
        render json: { status: :not_acceptable, message: phylo_tree.errors.full_messages }
      end
    end
  end

  # GET /phylo_tree_ngs/choose_taxon
  def choose_taxon
    tax_levels = nil
    if collection_params[:args].present?
      # Note(2021-07-01): Right now only "species,genus" is being sent:
      tax_levels = params[:args].split(",").select { |l| TaxonCount::NAME_2_LEVEL[l] }
    end

    filters = {}
    if collection_params[:projectId]
      filters[:projectId] = current_power.projects.find(collection_params[:projectId]).id
    end
    if collection_params[:sampleId]
      # Note: 'where' because downstream expects a Relation.
      filters[:samples] = current_power.samples.where(id: collection_params[:sampleId])
    end
    if AppConfigHelper.get_app_config(AppConfig::BYPASS_ES_TAXON_SEARCH) == "1"
      taxa_results = [
        {
          "title": "Klebsiella variicola",
          "description": "Taxonomy ID: 244366",
          "taxid": 244_366,
          "level": "species",
          "category": "Taxon",
        },
        {
          "title": "Klebsiella pneumoniae",
          "description": "Taxonomy ID: 573",
          "taxid": 573,
          "level": "species",
          "category": "Taxon",
        },
        {
          "title": "Klebsiella aerogenes",
          "description": "Taxonomy ID: 548",
          "taxid": 548,
          "level": "species",
          "category": "Taxon",
        },
        {
          "title": "Klebsiella oxytoca",
          "description": "Taxonomy ID: 571",
          "taxid": 571,
          "level": "species",
          "category": "Taxon",
        },
        {
          "title": "Klebsiella michiganensis",
          "description": "Taxonomy ID: 1134687",
          "taxid": 1_134_687,
          "level": "species",
          "category": "Taxon",
        },
        {
          "title": "Klebsiella but with a really reallly really really really long name",
          "description": "Taxonomy ID: 570",
          "taxid": 570,
          "level": "genus",
          "category": "Taxon",
        },
        {
          "title": "Betacoronavirus",
          "description": "Taxonomy ID: 694002",
          "taxid": 694_002,
          "level": "genus",
          "category": "Taxon",
        },
      ]

      # the actual elasticsearch query returns no results when the query is empty
      taxon_list = nil
      if collection_params[:query].present?
        taxon_list = taxa_results.select { |result| result[:title].downcase.include?(collection_params[:query]) }
      end

    else
      taxon_list = taxon_search(collection_params[:query], tax_levels, filters)
    end
    render json: JSON.dump(taxon_list)
  end

  # GET /phylo_tree_ngs/validate_name
  def validate_name
    name = sanitize_title_name(collection_params[:name])
    pt = PhyloTreeNg.new(name: name)
    pt.valid?
    valid = !(pt.errors.key?(:name) || PhyloTreeNg.exists?(name: name) || PhyloTree.exists?(name: name))
    render json: {
      valid: valid,
      sanitizedName: name,
    }
  end

  # PUT /phylo_tree_ngs/:id/rerun
  def rerun
    phylo_tree = current_power.updatable_phylo_tree_ngs.find(member_params[:id])
    new_tree = phylo_tree.rerun
    render json: { status: "success", id: new_tree.id }, status: :ok
  rescue StandardError => e
    LogUtil.log_error("Rerun trigger failed", exception: e, phylo_tree_id: phylo_tree&.id)
    render json: {
      status: "error",
      message: e.message,
    }, status: :internal_server_error
  end

  # GET /phylo_tree_ngs/:id/download
  def download
    output_name = member_params[:output]
    unless PhyloTreeNg::DOWNLOADABLE_OUTPUTS.include?(output_name)
      raise "Invalid output requested"
    end

    s3_path = @phylo_tree_ng.output_path(output_name)
    # Ex: "Cool Tree_ska.distances.tsv"
    filename = "#{@phylo_tree_ng.name}_#{File.basename(s3_path)}"
    url = get_presigned_s3_url(s3_path: s3_path, filename: filename)
    if url
      redirect_to url
    else
      raise "Requested output not found for this tree"
    end
  rescue StandardError => e
    message = "Unexpected error in phylo tree NG download"
    LogUtil.log_error(message, exception: e, id: @phylo_tree_ng.id)
    render(
      json: { status: message },
      status: :internal_server_error
    )
  end

  private

  def set_phylo_tree
    @phylo_tree_ng = current_power.viewable_phylo_tree_ngs.find(member_params[:id])
  end

  def collection_params
    params.permit(:name, :query, :args, :projectId, :sampleId)
  end

  def index_params
    params.permit(:taxId, :projectId)
  end

  def member_params
    params.permit(:id, :output)
  end

  def new_params
    params.permit(
      :getAdditionalSamples,
      :projectId,
      :taxId,
      :filter,
      { pipelineRunIds: [] }
    )
  end

  def create_params
    params.permit(:name, :projectId, :taxId, { pipelineRunIds: [] })
  end

  def fetch_phylo_tree_ngs(filters: {})
    phylo_tree_ngs = current_power.viewable_phylo_tree_ngs.non_deprecated.order(updated_at: :desc)
    phylo_tree_ngs = filter_phylo_tree_ngs(phylo_tree_ngs: phylo_tree_ngs, filters: filters)
    phylo_tree_ngs
  end

  def filter_phylo_tree_ngs(phylo_tree_ngs:, filters: {})
    tax_id = filters[:taxId]
    project_id = filters[:projectId]

    phylo_tree_ngs = phylo_tree_ngs.where(project_id: project_id) if project_id.present?
    phylo_tree_ngs = phylo_tree_ngs.where(tax_id: tax_id) if tax_id.present?
    phylo_tree_ngs
  end

  def format_phylo_tree_ngs(phylo_tree_ngs:, mode: "basic")
    basic_attributes = [:id, :name, :updated_at]

    if mode == "basic"
      phylo_tree_ngs = phylo_tree_ngs.includes(:user).map do |pt|
        formatted_pt = pt.slice(*basic_attributes)
        formatted_pt[:user] = pt.user.slice(:name, :id)
        formatted_pt[:nextGeneration] = true
        formatted_pt
      end
    end

    phylo_tree_ngs
  end

  def get_additional_reference_accession_ids(pipeline_run_ids, tax_id)
    additional_reference_accession_ids = Set.new()
    # TODO: refactor this to query AccessionCoverageStats instead of fetching from s3
    pipeline_run_ids.each do |pipeline_run_id|
      coverage_viz_summary_s3_path = current_power.pipeline_runs.find(pipeline_run_id).coverage_viz_summary_s3_path
      if coverage_viz_summary_s3_path
        coverage_viz_summary = S3Util.get_s3_file(coverage_viz_summary_s3_path)
        if coverage_viz_summary
          coverage_viz_summary = JSON.parse(coverage_viz_summary)
          top_accession = get_top_accession_from_coverage_viz_summary(coverage_viz_summary, tax_id)
          additional_reference_accession_ids.add(top_accession) if top_accession.present?
        end
      end
    end

    additional_reference_accession_ids.to_a
  end

  def get_top_accession_from_coverage_viz_summary(coverage_viz_summary, tax_id)
    if coverage_viz_summary[tax_id.to_s]
      best_accessions = coverage_viz_summary[tax_id.to_s]["best_accessions"]
      return best_accessions.first["id"]
    else
      available_reference_tax_ids = coverage_viz_summary.keys()
      species_ids = TaxonLineage.where(genus_taxid: tax_id, species_taxid: available_reference_tax_ids).distinct.pluck(:species_taxid)
      if species_ids.first
        best_accessions = coverage_viz_summary[species_ids.first.to_s]["best_accessions"]
        return best_accessions.first["id"]
      end
    end
  end

  def sample_details_json(pipeline_run_ids, tax_id, contigs_only: true)
    return [] if pipeline_run_ids.blank?
    return [] if ApplicationHelper::HUMAN_TAX_IDS.include? tax_id.to_i

    sanitized_join_sql_statement = if contigs_only
                                     # Only capture contigs that contain the specified taxon.
                                     ActiveRecord::Base.sanitize_sql_array(["
        JOIN contigs ON (
          pipeline_runs.id = contigs.pipeline_run_id AND (
            contigs.species_taxid_nt = :tax_id OR
            contigs.genus_taxid_nt = :tax_id
          )
        )", tax_id: tax_id,])
                                   else
                                     # Need left join here so we can capture contigs that contain the specified taxon, or 0 if there are no matches.
                                     ActiveRecord::Base.sanitize_sql_array(["
        LEFT JOIN contigs ON (
          pipeline_runs.id = contigs.pipeline_run_id AND (
            contigs.species_taxid_nt = :tax_id OR
            contigs.genus_taxid_nt = :tax_id
          )
        )", tax_id: tax_id,])
                                   end

    # Get the pipeline run's coverage breadth for the specified taxon, if available.
    coverage_stats_query = ActiveRecord::Base.sanitize_sql_array(["
                      LEFT JOIN accession_coverage_stats AS stats ON (
                        pipeline_runs.id = stats.pipeline_run_id AND
                        stats.taxid = :tax_id
                      )
                    ", tax_id: tax_id,])

    # If the taxon of interest is at the genus level, get the coverage breadth of species with the highest number of contigs within that genus,
    # similar to how selecting coverage viz from the genus row works on the sample report.
    tax_level = TaxonLineage.where(taxid: tax_id).last.tax_level
    if tax_level == TaxonCount::TAX_LEVEL_GENUS
      species_taxids = TaxonLineage.where(genus_taxid: tax_id).distinct.pluck(:species_taxid).filter { |species_taxid| species_taxid > 0 }

      # For each pipeline_run_id, select the AccessionCoverageStat with the highest number of contigs where the taxid is in species_taxids.
      # Join this to the query below so we can get the coverage_breadth for the pipeline run.
      coverage_stats_query = accession_coverage_stats_query(species_taxids)
    end

    # We limit how many rows will be displayed in "additional samples" to prevent
    # the modal from timing out for admins, but we still want to maximize the number of
    # relevant samples displayed for users, so we filter out samples with 0 contigs and display
    # up to the ELIGIBLE_PIPELINE_RUNS_LIMIT.
    # However, we still want to ensure that all project samples are visible in the "project samples"
    # step, so we do not filter out samples with 0 contigs and want to ensure that all are included.
    runs_limit = contigs_only ? ELIGIBLE_PIPELINE_RUNS_LIMIT : pipeline_run_ids.length

    # Retrieve information for displaying the tree's sample list.
    # Expose it as an array of hashes containing
    # - sample name
    # - project id and name
    # - pipeline run id to be used for the sample
    # - the pipeline run's version
    # - number of contigs that contain the specified taxon
    # - the sample's coverage breadth for the taxon
    samples_projects = current_power.pipeline_runs.joins(sample: [:project, :host_genome]).joins(Arel.sql(coverage_stats_query)).joins(Arel.sql(sanitized_join_sql_statement)).where(
      id: pipeline_run_ids
    ).group("id").order(id: :desc).limit(runs_limit).pluck(Arel.sql("
      samples.name,
      samples.project_id,
      samples.created_at,
      host_genomes.name as host,
      projects.name as project_name,
      pipeline_runs.id as pipeline_run_id,
      pipeline_runs.wdl_version as pipeline_version,
      samples.id as sample_id,
      COUNT(DISTINCT(contigs.id)) as num_contigs,
      MAX(stats.coverage_breadth)
    ")).map do |name, project_id, created_at, host, project_name, pipeline_run_id, pipeline_version, sample_id, num_contigs, coverage_breadth|
      {
        "name" => name,
        "project_id" => project_id,
        "created_at" => created_at,
        "host" => host,
        "project_name" => project_name,
        "pipeline_run_id" => pipeline_run_id,
        "pipeline_version" => pipeline_version,
        "sample_id" => sample_id,
        "num_contigs" => num_contigs,
        "coverage_breadth" => coverage_breadth,
      }
    end

    metadata_by_sample_id = Metadatum.by_sample_ids(samples_projects.pluck("sample_id"), use_raw_date_strings: true)
    samples_projects.each do |sp|
      if metadata_by_sample_id[sp["sample_id"]]
        sp["tissue"] = metadata_by_sample_id[sp["sample_id"]][:sample_type]
        sp["location"] = metadata_by_sample_id[sp["sample_id"]][:collection_location_v2]
      end
    end

    samples_projects
  end

  def accession_coverage_stats_query(species_taxids)
    # For each pipeline_run_id, select the AccessionCoverageStat with the highest number of contigs where the taxid is in species_taxids.
    ActiveRecord::Base.sanitize_sql_array(["
      LEFT JOIN (
        SELECT coverage_stats.pipeline_run_id, coverage_stats.coverage_breadth
        FROM (
          SELECT pipeline_run_id, MAX(num_contigs) as maxcontigs
          FROM accession_coverage_stats
          WHERE taxid IN (:species_taxids)
          GROUP BY pipeline_run_id
        ) AS top_stats
        INNER JOIN (
          SELECT pipeline_run_id, coverage_breadth, num_contigs
          FROM accession_coverage_stats
          WHERE taxid IN (:species_taxids)
        ) AS coverage_stats ON (
          coverage_stats.pipeline_run_id = top_stats.pipeline_run_id AND
          coverage_stats.num_contigs = top_stats.maxcontigs
          )
      ) AS stats ON (
          pipeline_runs.id = stats.pipeline_run_id
        )", species_taxids: species_taxids,])
  end

  def get_coverage_breadth_for_pipeline_runs(pipeline_runs, taxid, fill_zero = false)
    # Get the coverage breadth for the given taxid, for each pipeline run.
    coverage_breadths = []
    tax_level = TaxonLineage.where(taxid: taxid).last.tax_level
    if tax_level == TaxonCount::TAX_LEVEL_SPECIES
      coverage_breadths = AccessionCoverageStat.where(pipeline_run: pipeline_runs, taxid: taxid).pluck(:pipeline_run_id, :coverage_breadth)
    else
      # If the taxon of interest is at the genus level, get the coverage breadth of species with the highest number of contigs within that genus,
      # similar to how selecting coverage viz from the genus row works on the sample report.
      species_taxids = TaxonLineage.where(genus_taxid: taxid).distinct.pluck(:species_taxid).filter { |species_taxid| species_taxid > 0 }

      # For each pipeline_run_id, select the AccessionCoverageStat with the highest number of contigs where the taxid is in species_taxids,
      # and get the coverage_breadth.
      coverage_stats_query = accession_coverage_stats_query(species_taxids)

      coverage_breadths = pipeline_runs.joins(Arel.sql(coverage_stats_query)).pluck(Arel.sql("stats.pipeline_run_id, stats.coverage_breadth"))
    end

    # Convert list of [pipeline_run_id, coverage_breadth] to a hash mapping pipeline_run_ids to coverage_breadths.
    pr_to_coverage_breadth = {}
    coverage_breadths.each do |pr_id, coverage|
      pr_to_coverage_breadth[pr_id] = coverage
    end

    # If there is no coverage breadth value for the specified taxon found for the pipeline run,
    # set it to 0.
    if fill_zero
      pipeline_runs.each do |pr|
        unless pr_to_coverage_breadth.key?(pr.id)
          pr_to_coverage_breadth[pr.id] = 0.0
        end
      end
    end

    pr_to_coverage_breadth
  end
end
