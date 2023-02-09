class LcrpPathogensService
  include Callable
  include ElasticsearchQueryHelper

  def initialize(
    pr_id_to_sample_id:,
    background_id:
  )
    @pr_id_to_sample_id = pr_id_to_sample_id
    if background_id
      # make sure background exists
      Background.find(background_id)
    end
    @background_id = background_id
  end

  def call
    return generate
  end

  private

  def generate
    pipeline_run_ids = @pr_id_to_sample_id.keys()

    known_pathogens = PathogenList.find_by(is_global: true).fetch_list_version().fetch_pathogens_info().pluck(:tax_id)
    viral_pathogens_hits = ElasticsearchQueryHelper.lcrp_viral_pathogens_for_pipeline_runs(pipeline_run_ids, @background_id, known_pathogens)
    viral_pathogens_by_sample = parse_lcrp_viral_pathogens_for_pipeline_runs(viral_pathogens_hits, @pr_id_to_sample_id)
    raw_nonviral_pathogens_result = ElasticsearchQueryHelper.lcrp_top_15_for_pipeline_runs(pipeline_run_ids, @background_id)
    top_15_nonviral_pathogen_candidates_by_sample = parse_lcrp_nonviral_pathogens_for_pipeline_runs(raw_nonviral_pathogens_result, @pr_id_to_sample_id)
    nonviral_pathogens_by_sample = compute_nonviral_lcrp_pathogens(top_15_nonviral_pathogen_candidates_by_sample, known_pathogens)
    return viral_pathogens_by_sample.deep_merge(nonviral_pathogens_by_sample)
  end

  def compute_nonviral_lcrp_pathogens(top_15_nonviral_pathogen_candidates_by_sample, known_pathogens)
    flagged_taxa_by_sample = {}

    top_15_nonviral_pathogen_candidates_by_sample.each do |sample_id, pathogen_candidates|
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
        flagged_taxa_hash = flagged_taxa.map { |taxon| [taxon["tax_id"], ["LCRP"]] }.to_h
        unless flagged_taxa_hash.empty?
          flagged_taxa_by_sample[sample_id] = flagged_taxa_hash
        end
      end
    end

    return flagged_taxa_by_sample
  end

  def parse_lcrp_viral_pathogens_for_pipeline_runs(es_hits, pr_id_to_sample_id)
    flagged_taxa_by_sample = {}
    es_hits.each do |hit|
      pr_id = hit["_source"]["pipeline_run_id"]
      sample_id = pr_id_to_sample_id[pr_id]
      tax_id = hit["_source"]["tax_id"]
      # TODO: clean up hash creation
      flagged_taxa_by_sample[sample_id] = flagged_taxa_by_sample.key?(sample_id) ? flagged_taxa_by_sample[sample_id] : {}
      taxa_hash = flagged_taxa_by_sample[sample_id]
      taxa_hash[tax_id] = taxa_hash.key?(tax_id) ? taxa_hash[tax_id] : []
      taxa_hash[tax_id].push("LCRP") # TODO: constant for flag
    end
    return flagged_taxa_by_sample
  end

  def parse_lcrp_nonviral_pathogens_for_pipeline_runs(raw_nonviral_pathogens_result, pr_id_to_sample_id)
    pathogen_candidates_by_sample = {}
    raw_nonviral_pathogens_result["aggregations"]["pipeline_runs"]["buckets"].each do |pipeline_run|
      pr_id = pipeline_run["key"]
      sample_id = pr_id_to_sample_id[pr_id]

      taxons = pipeline_run["top_taxons_by_rpm"]["hits"]["hits"]
      taxon_details = taxons.map { |taxon| taxon["_source"] }

      pathogen_candidates_by_sample[sample_id] = taxon_details
    end
    return pathogen_candidates_by_sample
  end
end
