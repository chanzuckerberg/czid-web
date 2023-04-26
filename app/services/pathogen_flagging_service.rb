class PathogenFlaggingService
  include Callable
  include ElasticsearchQueryHelper

  def initialize(
    pipeline_run_ids:,
    background_id:,
    es_preflight_success: false,
    selected_flags: nil
  )
    @pipeline_run_ids = pipeline_run_ids
    if background_id
      # make sure background exists
      Background.find(background_id)
    end
    @background_id = background_id # will be null if the user has not selected a background
    # boolean indicating whether or not the given pipeline_run_ids have been confirmed to be in ES
    @es_preflight_success = es_preflight_success
    @selected_flags = selected_flags
  end

  def call
    return generate
  end

  private

  # given a list of pipeline run ids and a background, return a hash that will return the list of pathogen flags
  # for a given pipeline_run_id and tax_id
  # e.g. { 123 => { 1234 => ["known_pathogen", "lcrp"], 1235 => ["lcrp"] } }
  def generate
    # load into ES any missing pipeline runs
    unless @es_preflight_success
      ElasticsearchQueryHelper.update_es_for_missing_data(
        @background_id || Rails.configuration.x.constants.default_background,
        @pipeline_run_ids
      )
    end

    known_pathogens = PathogenList.find_by(is_global: true).fetch_list_version().fetch_pathogens_info().pluck(:tax_id)

    known_pathogens_by_pr_id = {}
    # fetch the known pathogens for the given pipeline runs
    if !@selected_flags || @selected_flags.include?(PipelineReportService::FLAG_KNOWN_PATHOGEN)
      # this allows dynamically selected pathogen lists in the future
      known_pathogen_hits = ElasticsearchQueryHelper.known_pathogens_for_pipeline_runs(@pipeline_run_ids, @background_id, known_pathogens)
      known_pathogens_by_pr_id = parse_pathogens_for_pipeline_runs(known_pathogen_hits, PipelineReportService::FLAG_KNOWN_PATHOGEN)
    end

    # compute the lcrp pathogens for the given pipeline runs
    lcrp_pathogens_by_pr_id = {}
    if !@selected_flags || @selected_flags.include?(PipelineReportService::FLAG_LCRP)
      # compute the lcrp viral pathogens
      viral_pathogens_hits = ElasticsearchQueryHelper.lcrp_viral_pathogens_for_pipeline_runs(@pipeline_run_ids, @background_id, known_pathogens)
      viral_pathogens_by_pr_id = parse_pathogens_for_pipeline_runs(viral_pathogens_hits, PipelineReportService::FLAG_LCRP)

      # compute the lcrp nonviral pathogens
      raw_nonviral_pathogens_result = ElasticsearchQueryHelper.lcrp_top_15_for_pipeline_runs(@pipeline_run_ids, @background_id)
      top_15_nonviral_pathogen_candidates_by_pr_id = parse_lcrp_nonviral_pathogens_for_pipeline_runs(raw_nonviral_pathogens_result)
      nonviral_pathogens_by_pr_id = compute_nonviral_lcrp_pathogens(top_15_nonviral_pathogen_candidates_by_pr_id, known_pathogens, @background_id)

      # merge viral and nonviral lcrp pathogens
      lcrp_pathogens_by_pr_id = viral_pathogens_by_pr_id.deep_merge(nonviral_pathogens_by_pr_id)
    end

    # compute the divergent pathogens for the given pipeline runs
    divergent_pathogens_by_pr_id = {}
    if !@selected_flags || @selected_flags.include?(PipelineReportService::FLAG_DIVERGENT)
      divergent_pathogen_hits = ElasticsearchQueryHelper.divergent_pathogens_for_pipeline_runs(@pipeline_run_ids, @background_id)
      divergent_pathogens_by_pr_id = parse_pathogens_for_pipeline_runs(divergent_pathogen_hits, PipelineReportService::FLAG_DIVERGENT)
    end

    # merge all flags into one hash
    return _merge_pathogen_flags(
      _merge_pathogen_flags(
        known_pathogens_by_pr_id,
        lcrp_pathogens_by_pr_id
      ),
      divergent_pathogens_by_pr_id
    )
  end

  def _merge_pathogen_flags(flags_by_id, other_flags_by_id)
    return flags_by_id.deep_merge(other_flags_by_id) do |_key, flags, other_flags|
    flags.concat(other_flags)
  end
  end

  def compute_nonviral_lcrp_pathogens(top_15_nonviral_pathogen_candidates_by_pr_id, known_pathogens, background_id)
    flagged_taxa_by_pr_id = {}

    top_15_nonviral_pathogen_candidates_by_pr_id.each do |pr_id, pathogen_candidates|
      # sort descending on NT rpm

      sorted_by_rpm = pathogen_candidates.sort_by { |candidate| -candidate["metric_list"].detect { |c| c["count_type"] == "NT" }["rpm"] }

      # compute the drops in rpm between each taxon
      rpm_drops = sorted_by_rpm
                  .map { |candidate| candidate["metric_list"].detect { |c| c["count_type"] == "NT" }["rpm"] }
                  .each_cons(2)
                  .map { |rpms| rpms[0] - rpms[1] }

      unless rpm_drops.empty?
        # determine where the largest rpm drop occurs and keep only those taxa before the drop
        largest_drop_index = rpm_drops.each_with_index.max[1]
        taxa_above_drop = sorted_by_rpm.slice(0, largest_drop_index + 1)

        # filter further for those taxa above the drop that are on the known pathogens list
        # and pass the zscore threshold to avoid water controls
        flagged_taxa = taxa_above_drop.filter do |candidate|
          known_pathogens.include?(candidate["tax_id"]) && (
            background_id.nil? ||
            candidate["metric_list"].detect { |c| c["count_type"] == "NT" }["zscore"] > 2
          )
        end

        # add the flagged taxa to output object
        flagged_taxa_hash = flagged_taxa.map { |taxon| [taxon["tax_id"], [PipelineReportService::FLAG_LCRP]] }.to_h
        unless flagged_taxa_hash.empty?
          flagged_taxa_by_pr_id[pr_id] = flagged_taxa_hash
        end
      end
    end

    return flagged_taxa_by_pr_id
  end

  def parse_pathogens_for_pipeline_runs(es_hits, flag_code)
    flagged_taxa_by_pr_id = {}
    es_hits.each do |hit|
      pr_id = hit["_source"]["pipeline_run_id"]
      tax_id = hit["_source"]["tax_id"]
      # TODO: clean up hash creation
      flagged_taxa_by_pr_id[pr_id] = flagged_taxa_by_pr_id.key?(pr_id) ? flagged_taxa_by_pr_id[pr_id] : {}
      taxa_hash = flagged_taxa_by_pr_id[pr_id]
      taxa_hash[tax_id] = taxa_hash.key?(tax_id) ? taxa_hash[tax_id] : []
      taxa_hash[tax_id].push(flag_code)
    end
    return flagged_taxa_by_pr_id
  end

  def parse_lcrp_nonviral_pathogens_for_pipeline_runs(raw_nonviral_pathogens_result)
    pathogen_candidates_by_pr_id = {}
    raw_nonviral_pathogens_result["aggregations"]["pipeline_runs"]["buckets"].each do |pipeline_run|
      pr_id = pipeline_run["key"]

      taxons = pipeline_run["top_taxons_by_rpm"]["hits"]["hits"]
      taxon_details = taxons.map { |taxon| taxon["_source"] }

      pathogen_candidates_by_pr_id[pr_id] = taxon_details
    end
    return pathogen_candidates_by_pr_id
  end
end
