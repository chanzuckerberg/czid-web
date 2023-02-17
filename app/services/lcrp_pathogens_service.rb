class LcrpPathogensService
  include Callable
  include ElasticsearchQueryHelper

  def initialize(
    pipeline_run_ids:,
    background_id:,
    es_preflight_success: false
  )
    @pipeline_run_ids = pipeline_run_ids
    if background_id
      # make sure background exists
      Background.find(background_id)
    end
    @background_id = background_id || 26
    # boolean indicating whether or not the given pipeline_run_ids have been confirmed to be in ES
    @es_preflight_success = es_preflight_success
  end

  def call
    return generate
  end

  private

  def generate
    # load into ES any missing pipeline runs
    unless @es_preflight_success
      ElasticsearchQueryHelper.update_es_for_missing_data(
        @background_id,
        @pipeline_run_ids
      )
    end

    known_pathogens = PathogenList.find_by(is_global: true).fetch_list_version().fetch_pathogens_info().pluck(:tax_id)
    viral_pathogens_hits = ElasticsearchQueryHelper.lcrp_viral_pathogens_for_pipeline_runs(@pipeline_run_ids, @background_id, known_pathogens)
    viral_pathogens_by_pr_id = parse_lcrp_viral_pathogens_for_pipeline_runs(viral_pathogens_hits)
    raw_nonviral_pathogens_result = ElasticsearchQueryHelper.lcrp_top_15_for_pipeline_runs(@pipeline_run_ids, @background_id)
    top_15_nonviral_pathogen_candidates_by_pr_id = parse_lcrp_nonviral_pathogens_for_pipeline_runs(raw_nonviral_pathogens_result)
    nonviral_pathogens_by_pr_id = compute_nonviral_lcrp_pathogens(top_15_nonviral_pathogen_candidates_by_pr_id, known_pathogens)
    return viral_pathogens_by_pr_id.deep_merge(nonviral_pathogens_by_pr_id)
  end

  def compute_nonviral_lcrp_pathogens(top_15_nonviral_pathogen_candidates_by_pr_id, known_pathogens)
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
        flagged_taxa = taxa_above_drop.filter { |candidate| known_pathogens.include?(candidate["tax_id"]) }

        # add the flagged taxa to output object
        flagged_taxa_hash = flagged_taxa.map { |taxon| [taxon["tax_id"], [PipelineReportService::FLAG_LCRP]] }.to_h
        unless flagged_taxa_hash.empty?
          flagged_taxa_by_pr_id[pr_id] = flagged_taxa_hash
        end
      end
    end

    return flagged_taxa_by_pr_id
  end

  def parse_lcrp_viral_pathogens_for_pipeline_runs(es_hits)
    flagged_taxa_by_pr_id = {}
    es_hits.each do |hit|
      pr_id = hit["_source"]["pipeline_run_id"]
      tax_id = hit["_source"]["tax_id"]
      # TODO: clean up hash creation
      flagged_taxa_by_pr_id[pr_id] = flagged_taxa_by_pr_id.key?(pr_id) ? flagged_taxa_by_pr_id[pr_id] : {}
      taxa_hash = flagged_taxa_by_pr_id[pr_id]
      taxa_hash[tax_id] = taxa_hash.key?(tax_id) ? taxa_hash[tax_id] : []
      taxa_hash[tax_id].push(PipelineReportService::FLAG_LCRP)
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
