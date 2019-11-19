class PipelineReportService
  include Callable

  FIELDS_TO_PLUCK = [
    :tax_id,
    :genus_taxid,
    :count_type,
    :tax_level,
    :count,
    :percent_identity,
    :alignment_length,
    :e_value,
    :mean,
    :stdev,
    :name # name needed for taxon scoring model?!
  ].freeze

  FIELDS_INDEX = Hash[FIELDS_TO_PLUCK.map.with_index { |field, i| [field, i] }]

  Z_SCORE_MIN = -99
  Z_SCORE_MAX =  99
  Z_SCORE_WHEN_ABSENT_FROM_BACKGROUND = 100
  Z_SCORE_WHEN_ABSENT_FROM_SAMPLE = -100

  DEFAULT_SORT_PARAM = :agg_score
  MIN_CONTIG_SIZE = 0

  def initialize(pipeline_run_id, background_id)
    @pipeline_run_id = pipeline_run_id
    @background_id = background_id
  end

  def call
    @timer = Timer.new("pipeline_report_service")
    report = generate
    @timer.publish
    return report
  end

  def generate
    pipeline_run = PipelineRun.find(@pipeline_run_id)
    adjusted_total_reads = (pipeline_run.total_reads - pipeline_run.total_ercc_reads.to_i) * pipeline_run.subsample_fraction
    @timer.split("initialize_and_adjust_reads")

    contigs = pipeline_run.get_summary_contig_counts_v2(MIN_CONTIG_SIZE)
    @timer.split("get_contig_summary")

    taxon_counts_and_summaries = fetch_taxon_counts(@pipeline_run_id, @background_id)
    @timer.split("fetch_taxon_counts_and_summaries")

    taxons_absent_from_sample = fetch_taxons_absent_from_sample(@pipeline_run_id, @background_id)
    @timer.split("fetch_taxons_absent_from_sample")

    taxons_absent_from_sample.each do |taxon|
      taxon_counts_and_summaries.concat([zero_metrics(*taxon)])
    end
    @timer.split("fill_zero_metrics")

    counts_by_tax_level = split_by_tax_level(taxon_counts_and_summaries)
    @timer.split("split_by_tax_level")

    counts_by_tax_level.transform_values! { |counts| hash_by_tax_id_and_count_type(counts) }
    @timer.split("index_by_tax_id_and_count_type")

    merge_contigs(contigs, counts_by_tax_level)
    @timer.split("merge_contigs")

    counts_by_tax_level.each_value do |tax_level_taxa|
      compute_z_scores(tax_level_taxa, adjusted_total_reads)
    end
    @timer.split("compute_z_scores")

    compute_aggregate_scores(
      counts_by_tax_level[TaxonCount::TAX_LEVEL_SPECIES],
      counts_by_tax_level[TaxonCount::TAX_LEVEL_GENUS]
    )
    @timer.split("compute_agg_scores")

    # TODO: in theory we should use TaxonLineage::fetch_lineage_by_taxid
    lineage_version = PipelineRun
                      .select("alignment_configs.lineage_version")
                      .joins(:alignment_config)
                      .find(@pipeline_run_id)[:lineage_version]

    required_columns = %w[
      taxid
      superkingdom_taxid kingdom_taxid phylum_taxid class_taxid order_taxid family_taxid
      superkingdom_name kingdom_name phylum_name class_name order_name family_name
    ]

    tax_ids = counts_by_tax_level[TaxonCount::TAX_LEVEL_GENUS].keys

    lineage_by_tax_id = TaxonLineage
                        .where(taxid: tax_ids)
                        .where('? BETWEEN version_start AND version_end', lineage_version)
                        .pluck(*required_columns)
                        .map { |r| [r[0], required_columns.zip(r).to_h] }
                        .to_h
    @timer.split("fetch_genus_lineage")

    structured_lineage = {}
    encode_taxon_lineage(lineage_by_tax_id, structured_lineage)
    @timer.split("encode_taxon_lineage")

    sorted_genus_tax_ids = sort_genus_tax_ids(counts_by_tax_level, DEFAULT_SORT_PARAM)
    @timer.split("sort_genus_by_aggregate_score")

    counts_by_tax_level[TaxonCount::TAX_LEVEL_GENUS].transform_values! do |genus|
      genus[:children].sort_by { |species_id| counts_by_tax_level[TaxonCount::TAX_LEVEL_SPECIES][species_id][:agg_score] }.reverse!
      genus
    end
    @timer.split("sort_species_within_each_genus")

    highlighted_tax_ids = find_taxa_to_highlight(sorted_genus_tax_ids, counts_by_tax_level)
    @timer.split("find_taxa_to_highlight")

    json_dump =
      JSON.dump(
        counts: counts_by_tax_level,
        lineage: structured_lineage,
        sortedGenus: sorted_genus_tax_ids,
        highlightedTaxIds: highlighted_tax_ids
      )
    @timer.split("convert_to_json_with_JSON")

    return json_dump
  end

  def fetch_taxon_counts(_pipeline_run_id, _background_id)
    taxon_counts_and_summaries_query = TaxonCount
                                       .joins("LEFT OUTER JOIN"\
                                          " taxon_summaries ON taxon_counts.count_type = taxon_summaries.count_type"\
                                          " AND taxon_counts.tax_level = taxon_summaries.tax_level"\
                                          " AND taxon_counts.tax_id = taxon_summaries.tax_id"\
                                          " AND taxon_summaries.background_id = #{@background_id}")
                                       .where(
                                         pipeline_run_id: @pipeline_run_id,
                                         count_type: ['NT', 'NR'],
                                         tax_level: [TaxonCount::TAX_LEVEL_SPECIES, TaxonCount::TAX_LEVEL_GENUS]
                                       )
                                       .where.not(
                                         tax_id: [TaxonLineage::BLACKLIST_GENUS_ID, TaxonLineage::HOMO_SAPIENS_TAX_ID]
                                       )
    # TODO: investigate the history behind BLACKLIST_GENUS_ID and if we can get rid of it ("All artificial constructs")

    return taxon_counts_and_summaries_query.pluck(*FIELDS_TO_PLUCK)
  end

  def zero_metrics(tax_id, tax_level, count_type, mean, stdev)
    # Fill in default zero values for FIELDS_TO_PLUCK.
    # Necessary for taxons absent from sample to match the taxon_counts_and_summaries structure,
    # since they're fetched from TaxonSummary, which doesn't have some columns listed in FIELDS_TO_PLUCK.
    # The two nil values (genus_taxid and name) will be filled in when counts_by_tax_level is
    # transformed to be indexed by taxid and count type.
    [
      tax_id,
      nil,
      count_type,
      tax_level,
      0,
      0,
      0,
      0,
      mean,
      stdev,
      nil,
    ]
  end

  def fetch_taxons_absent_from_sample(_pipeline_run_id, _background_id)
    taxons_absent_from_sample = TaxonSummary
                                .joins(
                                  " LEFT JOIN taxon_counts ON ("\
                                    " taxon_counts.count_type = taxon_summaries.count_type"\
                                    " AND taxon_counts.tax_level = taxon_summaries.tax_level"\
                                    " AND taxon_counts.tax_id = taxon_summaries.tax_id"\
                                    " AND taxon_summaries.background_id = #{@background_id}"\
                                    " AND taxon_counts.pipeline_run_id = #{@pipeline_run_id}"\
                                  " )"\
                                " WHERE"\
                                  " taxon_summaries.background_id = #{@background_id}"\
                                  " AND taxon_counts.count IS NULL"\
                                  " AND taxon_summaries.tax_id IN"\
                                    " (SELECT DISTINCT tax_id FROM taxon_counts"\
                                    " WHERE taxon_counts.pipeline_run_id=#{@pipeline_run_id})"
                                )

    return taxons_absent_from_sample.pluck(:tax_id, :tax_level, :count_type, :mean, :stdev)
  end

  def split_by_tax_level(counts_array)
    return counts_array.group_by { |entry| entry[FIELDS_INDEX[:tax_level]] }
  end

  def hash_by_tax_id_and_count_type(counts_array)
    counts_hash = {}
    counts_array.each do |counts|
      tax_id = counts[FIELDS_INDEX[:tax_id]]
      counts_hash[tax_id] ||= {
        genus_tax_id: counts[FIELDS_INDEX[:genus_taxid]],
        name: counts[FIELDS_INDEX[:name]],
      }
      counts_hash[tax_id][counts[FIELDS_INDEX[:count_type]].downcase!.to_sym] = {
        count: counts[FIELDS_INDEX[:count]],
        percent_identity: counts[FIELDS_INDEX[:percent_identity]],
        alignment_length: counts[FIELDS_INDEX[:alignment_length]],
        e_value: counts[FIELDS_INDEX[:e_value]].abs,
        bg_mean: counts[FIELDS_INDEX[:mean]],
        bg_stdev: counts[FIELDS_INDEX[:stdev]],
      }
    end
    return counts_hash
  end

  def merge_contigs(contigs, counts_by_tax_level)
    contigs.each do |tax_id, contigs_per_db_type|
      contigs_per_db_type.each do |db_type, contig_stats|
        norm_count_type = db_type.downcase.to_sym
        counts_per_db_type = counts_by_tax_level.dig(TaxonCount::TAX_LEVEL_SPECIES, tax_id, norm_count_type)
        if counts_per_db_type
          counts_per_db_type[:contigs] = contig_stats[:contigs]
          counts_per_db_type[:contig_reads] = contig_stats[:contig_reads]
        end

        genus_counts_per_db_type = counts_by_tax_level.dig(TaxonCount::TAX_LEVEL_GENUS, tax_id, norm_count_type)
        if genus_counts_per_db_type
          genus_counts_per_db_type[:contigs] = genus_counts_per_db_type[:contigs].to_f + contig_stats[:contigs]
          genus_counts_per_db_type[:contig_reads] = genus_counts_per_db_type[:contigs].to_f + contig_stats[:contig_reads]
        end
      end
    end
  end

  def compute_z_score(rpm, mean, stdev, min_z_score = Z_SCORE_MIN, max_z_score = Z_SCORE_MAX, absent_z_score = Z_SCORE_WHEN_ABSENT_FROM_BACKGROUND)
    return absent_z_score unless stdev
    value = (rpm - mean) / stdev
    return value.clamp(min_z_score, max_z_score)
  end

  def compute_z_scores(taxa_counts, adjusted_total_reads)
    taxa_counts.each_value do |taxon_counts|
      # TODO : consider moving rpm calc to more appropriate place
      # TODO : consider always creating nt and nr hashes to facilitate computation
      taxon_counts[:nt][:rpm] = taxon_counts[:nt][:count] * 1E6 / adjusted_total_reads if taxon_counts[:nt].present?
      taxon_counts[:nr][:rpm] = taxon_counts[:nr][:count] * 1E6 / adjusted_total_reads if taxon_counts[:nr].present?

      nt_z_score = compute_z_score(taxon_counts[:nt][:rpm], taxon_counts[:nt][:bg_mean], taxon_counts[:nt][:bg_stdev]) if taxon_counts[:nt].present?
      nr_z_score = compute_z_score(taxon_counts[:nr][:rpm], taxon_counts[:nr][:bg_mean], taxon_counts[:nr][:bg_stdev]) if taxon_counts[:nr].present?
      taxon_counts[:nt][:z_score] = nt_z_score if taxon_counts[:nt].present?
      taxon_counts[:nr][:z_score] = nr_z_score if taxon_counts[:nr].present?
      taxon_counts[:nt][:z_score] = taxon_counts[:nt][:count] != 0 ? nt_z_score : Z_SCORE_WHEN_ABSENT_FROM_SAMPLE if taxon_counts[:nt].present?
      taxon_counts[:nr][:z_score] = taxon_counts[:nr][:count] != 0 ? nr_z_score : Z_SCORE_WHEN_ABSENT_FROM_SAMPLE if taxon_counts[:nr].present?
      taxon_counts[:max_z_score] = nr_z_score.nil? || (nt_z_score && nt_z_score > nr_z_score) ? nt_z_score : nr_z_score
    end
  end

  def compute_aggregate_scores(species_counts, genus_counts)
    species_counts.each do |tax_id, species|
      genus = genus_counts[species[:genus_tax_id]]
      # Workaround placeholder for bad data (e.g. species counts present in TaxonSummary but genus counts aren't)
      genus_nt_zscore = genus[:nt].present? ? genus[:nt][:z_score] : 100
      genus_nr_zscore = genus[:nr].present? ? genus[:nr][:z_score] : 100
      if species[:nt].present? && genus[:nt].blank?
        Rails.logger.warn("NT data present for species #{tax_id} but missing for genus #{species[:genus_tax_id]}.")
      end
      if species[:nr].present? && genus[:nr].blank?
        Rails.logger.warn("NR data present for species #{tax_id} but missing for genus #{species[:genus_tax_id]}.")
      end

      species[:agg_score] = (species[:nt].present? ? genus_nt_zscore.abs * species[:nt][:z_score] * species[:nt][:rpm] : 0) \
        + (species[:nr].present? ? genus_nr_zscore.abs * species[:nr][:z_score] * species[:nr][:rpm] : 0)
      genus[:agg_score] = species[:agg_score] if genus[:agg_score].nil? || genus[:agg_score] < species[:agg_score]
      # TODO : more this to a more logical place
      if !genus[:children]
        genus[:children] = [tax_id]
      else
        genus[:children].append(tax_id)
      end
    end
  end

  def encode_taxon_lineage(lineage_by_tax_id, structured_lineage)
    ranks = ["superkingdom", "kingdom", "phylum", "class", "order", "family"]

    lineage_by_tax_id.each_value do |lineage|
      tax_lineage_key = nil
      ranks.each do |rank|
        tax_id = lineage["#{rank}_taxid"]
        new_tax_lineage_key = tax_lineage_key.nil? ? tax_id.to_s : "#{tax_lineage_key}:#{tax_id}"

        next if structured_lineage.key?(new_tax_lineage_key)

        structured_lineage[new_tax_lineage_key] = {
          name: lineage["#{rank}_name"],
          parent: tax_lineage_key,
          rank: rank,
        }
        tax_lineage_key = new_tax_lineage_key
      end
    end
  end

  def sort_genus_tax_ids(counts_by_tax_level, field)
    return counts_by_tax_level[TaxonCount::TAX_LEVEL_GENUS]
           .values
           .sort_by { |genus| genus[field] }
           .map { |genus| genus[:genus_tax_id] }
           .reverse!
  end

  def find_taxa_to_highlight(sorted_genus_tax_ids, counts_by_tax_level)
    ui_config = UiConfig.last
    return unless ui_config

    highlighted_tax_ids = []

    meets_highlight_condition = lambda do |counts|
      return (counts.dig(:nt, :rpm) || 0) > ui_config.min_nt_rpm \
        && (counts.dig(:nr, :rpm) || 0) > ui_config.min_nr_rpm \
        && (counts.dig(:nt, :z_score) || 0) > ui_config.min_nt_z \
        && (counts.dig(:nr, :z_score) || 0) > ui_config.min_nr_z
    end

    sorted_genus_tax_ids.each do |genus_tax_id|
      genus_taxon = counts_by_tax_level[TaxonCount::TAX_LEVEL_GENUS][genus_tax_id]
      highlighted_children = false
      genus_taxon[:children].each do |species_tax_id|
        return highlighted_tax_ids if highlighted_tax_ids.length >= ui_config.top_n

        species_taxon = counts_by_tax_level[TaxonCount::TAX_LEVEL_SPECIES][species_tax_id]
        if meets_highlight_condition.call(species_taxon)
          highlighted_tax_ids << species_tax_id
          highlighted_children = true
        end
      end

      # if children species were not highlighted check genus
      if meets_highlight_condition.call(genus_taxon)
        highlighted_tax_ids << genus_tax_id
      end
    end
    return highlighted_tax_ids
  end
end
