class PipelineReportService
  include Callable
  include ReportsHelper

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
    :name,
    :common_name,
    :superkingdom_taxid,
    :is_phage,
  ].freeze

  FIELDS_DEFAULTS = {
    tax_id: nil,
    genus_taxid: nil,
    count_type: nil,
    tax_level: nil,
    count: 0,
    percent_identity: 0,
    alignment_length: 0,
    e_value: 0,
    mean: nil,
    stdev: nil,
    name: nil,
  }.freeze

  FIELDS_INDEX = Hash[FIELDS_TO_PLUCK.map.with_index { |field, i| [field, i] }]

  Z_SCORE_MIN = -99
  Z_SCORE_MAX =  99
  Z_SCORE_WHEN_ABSENT_FROM_BACKGROUND = 100
  Z_SCORE_WHEN_ABSENT_FROM_SAMPLE = -100

  DEFAULT_SORT_PARAM = :agg_score
  DEFAULT_MIN_CONTIG_SIZE = 0

  CATEGORIES = {
    2 => "bacteria",
    2_157 => "archaea",
    2_759 => "eukaryota",
    10_239 => "viruses",
    12_884 => "viroids",
    nil => "uncategorized",
  }.freeze

  def initialize(pipeline_run_id, background_id, csv = false, min_contig_size = DEFAULT_MIN_CONTIG_SIZE)
    @pipeline_run_id = pipeline_run_id
    @background_id = background_id
    @csv = csv
    @min_contig_size = min_contig_size
  end

  def call
    @timer = Timer.new("pipeline_report_service")
    report = generate
    @timer.publish
    return report
  end

  def generate
    if @pipeline_run_id.nil?
      return JSON.dump(
        pipelineRunInfo: {
          pipelineRunComplete: false,
          pipelineRunFailed: false,
          sampleStatus: "Waiting to Start or Receive Files",
          errorMessage: nil,
          knownUserError: nil,
        },
        metadata: {},
        counts: {},
        lineage: {},
        sortedGenus: [],
        highlightedTaxIds: []
      )
    end

    pipeline_run = PipelineRun.find(@pipeline_run_id)
    if pipeline_run.total_reads.nil? || pipeline_run.adjusted_remaining_reads.nil? || !pipeline_run.completed?
      return JSON.dump(
        pipelineRunInfo: {
          pipelineRunComplete: pipeline_run.completed?,
          pipelineRunFailed: pipeline_run.failed?,
          sampleStatus: pipeline_run.job_status_display,
          errorMessage: pipeline_run.error_message,
          knownUserError: pipeline_run.known_user_error,
        },
        metadata: {},
        counts: {},
        lineage: {},
        sortedGenus: [],
        highlightedTaxIds: []
      )
    end
    adjusted_total_reads = (pipeline_run.total_reads - pipeline_run.total_ercc_reads.to_i) * pipeline_run.subsample_fraction
    @timer.split("initialize_and_adjust_reads")

    contigs = pipeline_run.get_summary_contig_counts_v2(@min_contig_size)
    @timer.split("get_contig_summary")

    taxon_counts_and_summaries = fetch_taxon_counts(@pipeline_run_id, @background_id)
    @timer.split("fetch_taxon_counts_and_summaries")

    taxons_absent_from_sample = fetch_taxons_absent_from_sample(@pipeline_run_id, @background_id)
    @timer.split("fetch_taxons_absent_from_sample")

    taxons_absent_from_sample.each do |taxon|
      taxon_counts_and_summaries.concat([zero_metrics(taxon)])
    end
    @timer.split("fill_zero_metrics")

    counts_by_tax_level = split_by_tax_level(taxon_counts_and_summaries)
    @timer.split("split_by_tax_level")

    counts_by_tax_level.transform_values! { |counts| hash_by_tax_id_and_count_type(counts) }
    @timer.split("index_by_tax_id_and_count_type")

    # TODO: this cleanup function is carried over from the previous version of the report,
    # check if this is still necessary?
    ReportsHelper.cleanup_missing_genus_counts(
      counts_by_tax_level[TaxonCount::TAX_LEVEL_SPECIES],
      counts_by_tax_level[TaxonCount::TAX_LEVEL_GENUS]
    )
    @timer.split("cleanup_missing_genus_counts")

    merge_contigs(contigs, counts_by_tax_level, @csv)
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

    # TODO: we should try to use TaxonLineage::fetch_lineage_by_taxid
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
    # If a species has an undefined genus (id < 0), the TaxonLineage id is based off the
    # species id rather than genus id, so select those species ids as well.
    # TODO: check if this step is still necessary after the data has been cleaned up.
    species_with_missing_genus = []
    counts_by_tax_level[TaxonCount::TAX_LEVEL_SPECIES].each do |tax_id, species|
      species_with_missing_genus += [tax_id] unless species[:genus_tax_id] >= 0
    end
    tax_ids.concat(species_with_missing_genus)

    lineage_by_tax_id = TaxonLineage
                        .where(taxid: tax_ids)
                        .where('? BETWEEN version_start AND version_end', lineage_version)
                        .pluck(*required_columns)
                        .map { |r| [r[0], required_columns.zip(r).to_h] }
                        .to_h
    @timer.split("fetch_taxon_lineage")

    ReportsHelper.validate_names(
      counts_by_tax_level,
      lineage_by_tax_id,
      @pipeline_run_id
    )
    @timer.split("fill_missing_names")

    structured_lineage = {}
    encode_taxon_lineage(lineage_by_tax_id, structured_lineage)
    @timer.split("encode_taxon_lineage")

    sorted_genus_tax_ids = sort_genus_tax_ids(counts_by_tax_level, DEFAULT_SORT_PARAM)
    @timer.split("sort_genus_by_aggregate_score")

    counts_by_tax_level[TaxonCount::TAX_LEVEL_GENUS].transform_values! do |genus|
      genus[:species_tax_ids] = genus[:species_tax_ids].sort_by { |species_id| counts_by_tax_level[TaxonCount::TAX_LEVEL_SPECIES][species_id][DEFAULT_SORT_PARAM] }.reverse!
      genus
    end
    @timer.split("sort_species_within_each_genus")

    highlighted_tax_ids = find_taxa_to_highlight(sorted_genus_tax_ids, counts_by_tax_level)
    @timer.split("find_taxa_to_highlight")

    if @csv
      return report_csv(counts_by_tax_level, sorted_genus_tax_ids)
    else
      json_dump =
        JSON.dump(
          pipelineRunInfo: {
            pipelineRunComplete: pipeline_run.completed?,
            pipelineRunFailed: pipeline_run.failed?,
            sampleStatus: pipeline_run.job_status_display,
            errorMessage: pipeline_run.error_message,
            knownUserError: pipeline_run.known_user_error,
          },
          metadata: {
            backgroundId: @background_id,
            truncatedReadsCount: pipeline_run.truncated,
            adjustedRemainingReadsCount: pipeline_run.adjusted_remaining_reads,
            subsampledReadsCount: pipeline_run.subsampled_reads,
          }.compact,
          counts: counts_by_tax_level,
          lineage: structured_lineage,
          sortedGenus: sorted_genus_tax_ids,
          highlightedTaxIds: highlighted_tax_ids
        )
      @timer.split("convert_to_json_with_JSON")

      return json_dump
    end
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

  def zero_metrics(taxon)
    # Fill in default zero values if a taxon is missing fields.
    # Necessary for taxons absent from sample to match the taxon_counts_and_summaries structure,
    # since they're fetched from TaxonSummary, which doesn't have some columns listed in FIELDS_TO_PLUCK.
    FIELDS_INDEX.each do |field, index|
      taxon[index] = FIELDS_DEFAULTS[field] unless taxon[index]
    end
    return taxon
  end

  def fetch_taxons_absent_from_sample(_pipeline_run_id, _background_id)
    tax_ids = TaxonCount.select(:tax_id).where(pipeline_run_id: @pipeline_run_id).distinct

    taxons_absent_from_sample = TaxonSummary
                                .joins("LEFT OUTER JOIN"\
                                  " taxon_counts ON taxon_counts.count_type = taxon_summaries.count_type"\
                                  " AND taxon_counts.tax_level = taxon_summaries.tax_level"\
                                  " AND taxon_counts.tax_id = taxon_summaries.tax_id"\
                                  " AND taxon_counts.pipeline_run_id = #{@pipeline_run_id}")
                                .where(
                                  "taxon_summaries.background_id": @background_id,
                                  "taxon_counts.count": nil,
                                  "taxon_summaries.tax_id": tax_ids,
                                  "taxon_summaries.tax_level": [TaxonCount::TAX_LEVEL_SPECIES, TaxonCount::TAX_LEVEL_GENUS],
                                  "taxon_summaries.count_type": ['NT', 'NR']
                                )

    return taxons_absent_from_sample.pluck(*FIELDS_TO_PLUCK)
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
        common_name: counts[FIELDS_INDEX[:common_name]],
        category: CATEGORIES[counts[FIELDS_INDEX[:superkingdom_taxid]]],
      }
      if counts[FIELDS_INDEX[:is_phage]] == 1
        counts_hash[tax_id][:subcategories] = ["phage"]
      end
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

  def merge_contigs(contigs, counts_by_tax_level, csv)
    contigs.each do |tax_id, contigs_per_db_type|
      contigs_per_db_type.each do |db_type, contigs_per_read_count|
        norm_count_type = db_type.downcase.to_sym
        counts_per_db_type = counts_by_tax_level.dig(TaxonCount::TAX_LEVEL_SPECIES, tax_id, norm_count_type)
        unless counts_per_db_type
          counts_per_db_type = counts_by_tax_level.dig(TaxonCount::TAX_LEVEL_GENUS, tax_id, norm_count_type)
        end

        if counts_per_db_type
          if csv
            contigs = 0
            contig_r = 0
            contigs_per_read_count.each do |reads, count|
              contigs += count
              contig_r += count * reads
            end
            counts_per_db_type[:contigs] = contigs
            counts_per_db_type[:contig_r] = contig_r
          else
            counts_per_db_type[:contigs] = contigs_per_read_count
          end
        else
          # TODO(tiago): not sure if this case ever happens
          Rails.logger.warn("[PR=#{@pipeline_run_id}] PR has contigs but not taxon counts for taxon #{tax_id} in #{db_type}: #{contigs_per_read_count}")
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
      # TODO: investigate why a count type appearing in species is missing in its genus.
      # JIRA: https://jira.czi.team/browse/IDSEQ-1807
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
      if !genus[:species_tax_ids]
        genus[:species_tax_ids] = [tax_id]
      else
        genus[:species_tax_ids].append(tax_id)
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
      genus_taxon[:species_tax_ids].each do |species_tax_id|
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

  def report_csv(counts, sorted_genus_tax_ids)
    rows = []
    sorted_genus_tax_ids.each do |genus_tax_id|
      genus_info = counts[2][genus_tax_id]
      # add the hash keys in order for csv generation
      genus_flat_hash = {}
      genus_flat_hash[[:tax_id]] = genus_tax_id
      genus_flat_hash[[:tax_level]] = 2
      genus_flat_hash = genus_flat_hash.merge(HashUtil.flat_hash(genus_info))
      rows << genus_flat_hash
      genus_info[:species_tax_ids].each do |species_tax_id|
        species_info = counts[1][species_tax_id]
        species_flat_hash = HashUtil.flat_hash(species_info)
        species_flat_hash[[:tax_id]] = species_tax_id
        species_flat_hash[[:tax_level]] = 1
        rows << species_flat_hash
      end
    end

    flat_keys = rows[0].keys
    flat_keys_symbols = flat_keys.map { |array_key| array_key.map(&:to_sym) }
    attribute_names = flat_keys_symbols.map { |k| k.map(&:to_s).join("_") }
    CSVSafe.generate(headers: true) do |csv|
      csv << attribute_names
      rows.each do |tax_info|
        tax_info_by_symbols = tax_info.map { |k, v| [k.map(&:to_sym), v] }.to_h
        csv << tax_info_by_symbols.values_at(*flat_keys_symbols)
      end
    end
  end
end
