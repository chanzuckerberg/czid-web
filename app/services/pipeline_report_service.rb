class PipelineReportService
  include Callable
  include ReportsHelper

  class MassNormalizedBackgroundError < StandardError
    def initialize(background_id, pipeline_run_id)
      super("background #{background_id} is mass normalized but pipeline run #{pipeline_run_id} has no ERCC reads")
    end
  end

  TAXON_COUNT_FIELDS_TO_PLUCK = [
    :alignment_length,
    :alignment_length_decimal,
    :common_name,
    :count_type,
    :e_value,
    :genus_taxid,
    :is_phage,
    :name,
    :percent_identity,
    :percent_identity_decimal,
    :source_count_type,
    :superkingdom_taxid,
    :tax_id,
    :tax_level,
  ].freeze

  TAXON_COUNT_SHORT_READS_FIELDS_TO_PLUCK = [
    :count,
    :rpm,
    :rpm_decimal,
  ].freeze

  TAXON_COUNT_LONG_READS_FIELDS_TO_PLUCK = [
    :count,
    :base_count,
    :bpm,
  ].freeze

  TAXON_COUNT_FIELDS_DEFAULTS = {
    alignment_length: 0,
    alignment_length_decimal: 0,
    count: 0,
    base_count: 0,
    count_type: nil,
    e_value: 0,
    genus_taxid: nil,
    name: nil,
    percent_identity: 0,
    percent_identity_decimal: 0,
    rpm: 0,
    rpm_decimal: 0,
    bpm: 0,
    tax_id: nil,
    tax_level: nil,
  }.freeze

  TAXON_SUMMARY_FIELDS_TO_PLUCK = [
    :mean,
    :mean_mass_normalized,
    :stdev,
    :stdev_mass_normalized,
  ].freeze

  TAXON_SUMMARY_FIELDS_DEFAULTS = {
    mean: nil,
    stdev: nil,
  }.freeze

  ILLUMINA = PipelineRun::TECHNOLOGY_INPUT[:illumina]
  NANOPORE = PipelineRun::TECHNOLOGY_INPUT[:nanopore]

  TAXON_COUNT_FIELDS_INDEX = {
    ILLUMINA => Hash[(TAXON_COUNT_FIELDS_TO_PLUCK + TAXON_COUNT_SHORT_READS_FIELDS_TO_PLUCK).map.with_index { |field, i| [field, i] }],
    NANOPORE => Hash[(TAXON_COUNT_FIELDS_TO_PLUCK + TAXON_COUNT_LONG_READS_FIELDS_TO_PLUCK).map.with_index { |field, i| [field, i] }],
  }.freeze

  TAXON_COUNT_AND_SUMMARY_FIELDS_INDEX = {
    ILLUMINA => Hash[(TAXON_COUNT_FIELDS_TO_PLUCK + TAXON_COUNT_SHORT_READS_FIELDS_TO_PLUCK + TAXON_SUMMARY_FIELDS_TO_PLUCK).map.with_index { |field, i| [field, i] }],
    NANOPORE => Hash[(TAXON_COUNT_FIELDS_TO_PLUCK + TAXON_COUNT_LONG_READS_FIELDS_TO_PLUCK + TAXON_SUMMARY_FIELDS_TO_PLUCK).map.with_index { |field, i| [field, i] }],
  }.freeze

  LINEAGE_COLUMNS = %w[
    taxid
    superkingdom_taxid kingdom_taxid phylum_taxid class_taxid order_taxid family_taxid genus_taxid species_taxid
    superkingdom_name kingdom_name phylum_name class_name order_name family_name genus_name species_name
  ].freeze

  Z_SCORE_MIN = -99
  Z_SCORE_MAX =  99
  Z_SCORE_WHEN_ABSENT_FROM_BACKGROUND = 100
  Z_SCORE_WHEN_ABSENT_FROM_SAMPLE = -100

  # These are criteria by which we choose which species to highlight in report
  UI_HIGHLIGHT_MIN_NT_Z = 1
  UI_HIGHLIGHT_MIN_NR_Z = 1
  UI_HIGHLIGHT_MIN_NT_RPM = 1
  UI_HIGHLIGHT_MIN_NR_RPM = 1
  UI_HIGHLIGHT_TOP_N = 3 # we only highlight (up to) top 3 which meet criteria

  DEFAULT_SORT_PARAM = :agg_score

  FLAG_KNOWN_PATHOGEN = "knownPathogen".freeze

  CSV_SHORT_READS_COLUMNS = [
    "tax_id",
    "tax_level",
    "genus_tax_id",
    "name",
    "common_name",
    "category",
    "is_phage",
    "agg_score",
    "max_z_score",
    "nt_z_score",
    "nt_rpm",
    "nt_count",
    "nt_contigs",
    "nt_contig_r",
    "nt_percent_identity",
    "nt_alignment_length",
    "nt_e_value",
    "nt_bg_mean",
    "nt_bg_stdev",
    "nt_bg_mean_mass_normalized",
    "nt_bg_stdev_mass_normalized",
    "nr_z_score",
    "nr_rpm",
    "nr_count",
    "nr_contigs",
    "nr_contig_r",
    "nr_percent_identity",
    "nr_alignment_length",
    "nr_e_value",
    "nr_bg_mean",
    "nr_bg_stdev",
    "nr_bg_mean_mass_normalized",
    "nr_bg_stdev_mass_normalized",
    "species_tax_ids",
    "known_pathogen",
  ].freeze

  CSV_LONG_READS_COLUMNS = [
    "tax_id",
    "tax_level",
    "genus_tax_id",
    "name",
    "common_name",
    "category",
    "is_phage",
    "nt_bpm",
    "nt_base_count",
    "nt_count",
    "nt_contigs",
    "nt_contig_b",
    "nt_percent_identity",
    "nt_alignment_length",
    "nt_e_value",
    "nr_bpm",
    "nr_base_count",
    "nr_count",
    "nr_contigs",
    "nr_contig_b",
    "nr_percent_identity",
    "nr_alignment_length",
    "nr_e_value",
    "species_tax_ids",
    "known_pathogen",
  ].freeze

  CSV_COLUMNS = {
    ILLUMINA => CSV_SHORT_READS_COLUMNS,
    NANOPORE => CSV_LONG_READS_COLUMNS,
  }.freeze

  def initialize(pipeline_run, background_id, csv: false, parallel: true, merge_nt_nr: false, show_annotations: false)
    @pipeline_run = pipeline_run
    @technology = pipeline_run.technology
    # In ont_v1, we are not supporting backgrounds for nanopore mngs samples
    @background = background_id ? Background.find(background_id) : nil
    @csv = csv
    @parallel = parallel
    @merge_nt_nr = merge_nt_nr
    @show_annotations = show_annotations
    @use_decimal_columns = AppConfigHelper.get_app_config(AppConfig::PIPELINE_REPORT_SERVICE_USE_DECIMAL_TYPE_COLUMNS, false) == "1"
  end

  def call
    @timer = Timer.new("pipeline_report_service")
    report = generate
    @timer.publish
    return report
  end

  def generate
    metadata = get_pipeline_status(@pipeline_run)
    # Only generate the report if the pipeline has initialized and has loaded
    # taxon_counts (is report_ready), or if its results are finalized without errors.
    # Otherwise just return the metadata, which includes statuses and error messages to display.
    # TODO(julie): refactor + clarify pipeline run statuses (JIRA: https://jira.czi.team/browse/IDSEQ-1890)
    total_count = @pipeline_run.fetch_total_count_by_technology
    unless @pipeline_run && (@pipeline_run.report_ready? || (@pipeline_run.finalized? && !@pipeline_run.failed?)) && total_count
      return JSON.dump(
        metadata: metadata
      )
    end

    if @background&.mass_normalized? && total_count.zero?
      raise MassNormalizedBackgroundError.new(@background.id, @pipeline_run.id)
    end

    adjusted_total_count = @pipeline_run.fetch_adjusted_total_count_by_technology

    @timer.split("initialize_and_adjust_reads_or_bases")

    # FETCH TAXON INFORMATION
    if @parallel
      parallel_steps = [
        -> { @pipeline_run.summary_contig_counts() },
        -> { fetch_taxon_counts(pipeline_run_id: @pipeline_run.id, count_types: [TaxonCount::COUNT_TYPE_NT, TaxonCount::COUNT_TYPE_NR], background_id: @background&.id, technology: @technology) },
        -> { fetch_taxons_absent_from_sample(@pipeline_run.id, @background&.id, @technology) },
      ]
      parallel_steps << -> { fetch_taxon_counts(pipeline_run_id: @pipeline_run.id, count_types: [TaxonCount::COUNT_TYPE_MERGED], technology: @technology) } if @merge_nt_nr
      results = nil
      ActiveSupport::Dependencies.interlock.permit_concurrent_loads do
        results = Parallel.map(parallel_steps, in_threads: parallel_steps.size) do |lambda|
          ActiveRecord::Base.connection_pool.with_connection do
            lambda.call()
          end
        rescue StandardError => e
          LogUtil.log_error(
            "Parallel fetch failed",
            exception: e,
            pipeline_run_id: @pipeline_run.id
          )
          raise e
        end
      end
      @timer.split("parallel_fetch_report_data")
      contigs, taxon_counts_and_summaries, taxons_absent_from_sample, merged_taxon_counts = *results
    else
      contigs = @pipeline_run.summary_contig_counts()
      @timer.split("get_contig_summary")

      taxon_counts_and_summaries = fetch_taxon_counts(pipeline_run_id: @pipeline_run.id, count_types: [TaxonCount::COUNT_TYPE_NT, TaxonCount::COUNT_TYPE_NR], background_id: @background&.id, technology: @technology)
      @timer.split("fetch_taxon_counts_and_summaries")

      taxons_absent_from_sample = fetch_taxons_absent_from_sample(@pipeline_run.id, @background&.id, @pipeline_run.technology)
      @timer.split("fetch_taxons_absent_from_sample")

      if @merge_nt_nr
        merged_taxon_counts = fetch_taxon_counts(pipeline_run_id: @pipeline_run.id, count_types: [TaxonCount::COUNT_TYPE_MERGED], technology: @technology)
        @timer.split("fetch_merged_taxon_counts")
      end
    end

    # PROCESS & TRANSFORM TAXON INFORMATION
    taxon_count_and_summary_default_values = TAXON_COUNT_FIELDS_DEFAULTS.merge(TAXON_SUMMARY_FIELDS_DEFAULTS)
    taxons_absent_from_sample.each do |taxon|
      taxon_counts_and_summaries.concat([zero_metrics(taxon: taxon, field_index: TAXON_COUNT_AND_SUMMARY_FIELDS_INDEX[@technology], default_values: taxon_count_and_summary_default_values)])
    end
    @timer.split("fill_zero_metrics")

    counts_by_tax_level = split_by_tax_level(taxon_counts_and_summaries, TAXON_COUNT_AND_SUMMARY_FIELDS_INDEX[@technology])
    @timer.split("split_by_tax_level")

    counts_by_tax_level.transform_values! { |counts| hash_by_tax_id_and_count_type(counts, TAXON_COUNT_AND_SUMMARY_FIELDS_INDEX[@technology]) }
    @timer.split("index_by_tax_id_and_count_type")

    merged_taxon_counts_by_tax_level = nil
    if @merge_nt_nr
      merged_taxon_counts_by_tax_level = split_by_tax_level(merged_taxon_counts, TAXON_COUNT_FIELDS_INDEX[@technology])
      @timer.split("merged_taxon_counts_split_by_tax_level")

      merged_taxon_counts_by_tax_level.transform_values! { |counts| hash_by_tax_id_and_count_type(counts, TAXON_COUNT_FIELDS_INDEX[@technology]) }
      @timer.split("merged_nt_nr_index_by_tax_id_and_count_type")
    end

    # In the edge case where there are no matching species found, skip all this processing.
    structured_lineage, sorted_genus_tax_ids, highlighted_tax_ids = process_taxon_counts_by_tax_level(taxon_counts: [counts_by_tax_level, merged_taxon_counts_by_tax_level], total_count: adjusted_total_count, contigs: contigs) if counts_by_tax_level[TaxonCount::TAX_LEVEL_SPECIES].present?

    all_tax_ids = if counts_by_tax_level[TaxonCount::TAX_LEVEL_GENUS].nil?
                    []
                  else
                    counts_by_tax_level[TaxonCount::TAX_LEVEL_GENUS].values.each_with_object([]) do |genus, tax_ids|
                      tax_ids << genus[:genus_tax_id]
                      tax_ids << genus[:species_tax_ids]
                    end.flatten.to_set
                  end

    # OUTPUT TAXON INFORMATION
    if @csv
      csv_output = report_csv(counts_by_tax_level, sorted_genus_tax_ids)
      @timer.split("generate_downloadable_csv")
      return csv_output
    else
      metadata = get_metadata_by_technology(metadata)

      json_dump =
        Oj.dump(
          {
            all_tax_ids: all_tax_ids,
            metadata: metadata.compact,
            counts: counts_by_tax_level,
            lineage: structured_lineage,
            sortedGenus: sorted_genus_tax_ids,
            highlightedTaxIds: highlighted_tax_ids,
          },
          mode: :compat
        )
      @timer.split("convert_to_json_with_OJ")

      return json_dump
    end
  end

  def process_taxon_counts_by_tax_level(taxon_counts:, total_count:, contigs:)
    # TODO(tiago): check if still necessary and move out of reports helper
    counts_by_tax_level, merged_count_types_by_tax_level = *taxon_counts
    species_counts = counts_by_tax_level[TaxonCount::TAX_LEVEL_SPECIES]
    genus_counts = counts_by_tax_level[TaxonCount::TAX_LEVEL_GENUS]

    ReportsHelper.cleanup_missing_genus_counts(species_counts, genus_counts)
    @timer.split("cleanup_missing_genus_counts")

    # Both Illumina and ONT pipeline runs store decimal rpm and/or bpm values.
    # For Illumina pipeline runs, count per million (aka rpm) values will be re-calcalated
    # if the PIPELINE_REPORT_SERVICE_USE_DECIMAL_TYPE_COLUMNS appconfig is on
    if !@use_decimal_columns && @technology == PipelineRun::TECHNOLOGY_INPUT[:illumina]
      counts_by_tax_level.each_value do |tax_level_taxa|
        compute_count_per_million(count_types: [:nt, :nr], taxa_counts: tax_level_taxa, total_count: total_count)
      end
      @timer.split("compute_count_per_million")

      if merged_count_types_by_tax_level.present?
        merged_count_types_by_tax_level.each_value do |tax_level_taxa|
          compute_count_per_million(count_types: [:merged_nt_nr], taxa_counts: tax_level_taxa, total_count: total_count)
        end
        @timer.split("compute_count_per_million_merged_count_type")
      end
    end

    counts_by_tax_level.each_value do |tax_level_taxa|
      compute_z_scores(tax_level_taxa)
    end
    @timer.split("compute_z_scores")

    compute_aggregate_scores(species_counts, genus_counts)
    @timer.split("compute_agg_scores")

    add_children_species_to_genus(species_counts, genus_counts)
    @timer.split("add_children_species_to_genus")

    lineage_version = PipelineRun
                      .select("alignment_configs.lineage_version")
                      .joins(:alignment_config)
                      .find(@pipeline_run.id)[:lineage_version]

    tax_ids = genus_counts.keys
    # If a species has an undefined genus (id < 0), the TaxonLineage id is based off the
    # species id rather than genus id, so select those species ids as well.
    # TODO: check if this step is still necessary after the data has been cleaned up.
    species_with_missing_genus = []
    species_counts.each do |tax_id, species|
      species_with_missing_genus += [tax_id] unless species[:genus_tax_id] >= 0
    end
    tax_ids.concat(species_with_missing_genus)

    lineage_by_tax_id = TaxonLineage
                        .where(taxid: tax_ids)
                        .where('? BETWEEN version_start AND version_end', lineage_version)
                        .pluck(*LINEAGE_COLUMNS)
                        .map { |r| [r[0], LINEAGE_COLUMNS.zip(r).to_h] }
                        .to_h
    @timer.split("fetch_taxon_lineage")

    # TODO(tiago):move out of reports helper
    ReportsHelper.validate_names(
      counts_by_tax_level,
      lineage_by_tax_id,
      @pipeline_run.id
    )
    @timer.split("fill_missing_names")

    # Flag pathogens (sample-agnostic)
    @timer.split("tag_pathogens")
    flag_pathogens(
      species_counts: species_counts
    )

    structured_lineage = encode_taxon_lineage(lineage_by_tax_id)
    @timer.split("encode_taxon_lineage")

    sorted_genus_tax_ids = sort_genus_tax_ids(counts_by_tax_level, DEFAULT_SORT_PARAM)
    @timer.split("sort_genus_by_aggregate_score")

    genus_counts.transform_values! do |genus|
      genus[:species_tax_ids] = genus[:species_tax_ids].sort_by { |species_id| species_counts[species_id][DEFAULT_SORT_PARAM] }.reverse!
      genus
    end
    @timer.split("sort_species_within_each_genus")

    merge_taxon_count_structures(merged_count_types_by_tax_level, counts_by_tax_level) if merged_count_types_by_tax_level.present?
    @timer.split("merge_taxon_count_structures")

    merge_contigs(contigs, counts_by_tax_level)
    @timer.split("merge_contigs")

    highlighted_tax_ids = find_species_to_highlight(sorted_genus_tax_ids, counts_by_tax_level)
    @timer.split("find_species_to_highlight")

    flag_annotations(sorted_genus_tax_ids, counts_by_tax_level)
    @timer.split("flag_annotations")

    return [structured_lineage, sorted_genus_tax_ids, highlighted_tax_ids]
  end

  def get_pipeline_status(pipeline_run)
    if pipeline_run.nil?
      return {
        pipelineRunStatus: "WAITING",
        errorMessage: nil,
        knownUserError: nil,
        jobStatus: "Waiting to Start or Receive Files",
        reportReady: false,
      }
    end

    # pipeline_run.results_finalized? indicates that the results monitor sees all outputs are in a finished state
    # (either loaded or failed). This can be true if there were errors, so we still need to check pipeline_run.failed? as well.
    # pipeline_run.report_ready? indicates if taxon_counts output is loaded and available to use in report generation.
    # This is only true if no errors have occurred for taxon_counts.

    # The pipeline is either still in progress or results monitor is waiting to load in outputs.
    pipeline_status = "WAITING"
    # The pipeline has stopped running and encountered errors.
    if pipeline_run.failed?
      pipeline_status = "FAILED"
    # The pipeline has finished running without critical errors and all outputs have been loaded.
    elsif pipeline_run.results_finalized?
      pipeline_status = "SUCCEEDED"
    end
    return {
      pipelineRunStatus: pipeline_status,
      hasErrors: pipeline_run.failed?,
      errorMessage: pipeline_run.error_message,
      knownUserError: pipeline_run.known_user_error,
      jobStatus: pipeline_run.job_status_display,
      reportReady: pipeline_run && pipeline_run.report_ready?,
    }
  end

  def get_metadata_by_technology(metadata)
    has_byte_ranges = @pipeline_run.taxon_byte_ranges_available?
    @timer.split("compute_options_available_for_pipeline_run")

    if @technology == PipelineRun::TECHNOLOGY_INPUT[:illumina]
      metadata.merge(
        backgroundId: @background&.id,
        truncatedReadsCount: @pipeline_run.truncated,
        preSubsamplingCount: @pipeline_run.adjusted_remaining_reads,
        postSubsamplingCount: @pipeline_run.subsampled_reads,
        taxonWhitelisted: @pipeline_run.use_taxon_whitelist,
        hasByteRanges: has_byte_ranges
      )
    elsif @technology == PipelineRun::TECHNOLOGY_INPUT[:nanopore]
      host_filtered_bases, subsampled_bases = @pipeline_run.bases_before_and_after_subsampling
      metadata.merge(
        backgroundId: nil,
        preSubsamplingCount: host_filtered_bases,
        postSubsamplingCount: subsampled_bases,
        taxonWhitelisted: @pipeline_run.use_taxon_whitelist,
        hasByteRanges: has_byte_ranges
      )
    end
  end

  def get_taxon_count_fields_to_pluck(technology)
    if technology == PipelineRun::TECHNOLOGY_INPUT[:illumina]
      TAXON_COUNT_FIELDS_TO_PLUCK + TAXON_COUNT_SHORT_READS_FIELDS_TO_PLUCK
    elsif technology == PipelineRun::TECHNOLOGY_INPUT[:nanopore]
      TAXON_COUNT_FIELDS_TO_PLUCK + TAXON_COUNT_LONG_READS_FIELDS_TO_PLUCK
    end
  end

  def fetch_taxon_counts(pipeline_run_id:, count_types:, background_id: nil, technology:)
    taxon_counts_query = TaxonCount
    if background_id.present?
      taxon_counts_query = taxon_counts_query
                           .joins("LEFT OUTER JOIN"\
                            " taxon_summaries ON taxon_counts.count_type = taxon_summaries.count_type"\
                            " AND taxon_counts.tax_level = taxon_summaries.tax_level"\
                            " AND taxon_counts.tax_id = taxon_summaries.tax_id"\
                            " AND taxon_summaries.background_id = #{background_id}")
    end

    taxon_counts_query = taxon_counts_query
                         .where(
                           pipeline_run_id: pipeline_run_id,
                           count_type: count_types,
                           tax_level: [TaxonCount::TAX_LEVEL_SPECIES, TaxonCount::TAX_LEVEL_GENUS]
                         )
                         .where.not(
                           tax_id: [
                             TaxonLineage::BLACKLIST_GENUS_ID,
                             TaxonLineage::HOMO_SAPIENS_TAX_IDS,
                           ].flatten
                         )

    taxon_count_fields = get_taxon_count_fields_to_pluck(technology)

    # TODO: investigate the history behind BLACKLIST_GENUS_ID and if we can get rid of it ("All artificial constructs")
    return background_id.nil? ? taxon_counts_query.pluck(*taxon_count_fields) : taxon_counts_query.pluck(*(taxon_count_fields + TAXON_SUMMARY_FIELDS_TO_PLUCK))
  end

  def merge_taxon_count_structures(merged_count_types_by_taxon_level, count_types_by_taxon_level)
    # Merges a taxon's :merged_nt_nr hash structure into count_types_by_taxon_level[level][tax_id]
    tax_levels = [TaxonCount::TAX_LEVEL_SPECIES, TaxonCount::TAX_LEVEL_GENUS, TaxonCount::TAX_LEVEL_FAMILY]
    tax_levels.each do |level|
      if merged_count_types_by_taxon_level[level].present?
        merged_count_types_by_taxon_level[level].each do |tax_id, hash|
          count_types_by_taxon_level[level][tax_id][:merged_nt_nr] = hash[:merged_nt_nr] if count_types_by_taxon_level[level][tax_id].present?
        end
      end
    end
  end

  def zero_metrics(taxon:, field_index:, default_values:)
    # Fill in default zero values if a taxon is missing fields.
    # Necessary for taxons absent from sample to match the taxon_counts_and_summaries structure,
    # since they're fetched from TaxonSummary, which doesn't have some columns listed in TAXON_COUNT_AND_SUMMARY_FIELDS_INDEX.
    field_index.each do |field, index|
      taxon[index] = default_values[field] unless taxon[index]
    end
    return taxon
  end

  def fetch_taxons_absent_from_sample(pipeline_run_id, background_id, technology)
    tax_ids = TaxonCount.select(:tax_id).where(pipeline_run_id: pipeline_run_id).distinct

    taxons_absent_from_sample = TaxonSummary
                                .joins("LEFT OUTER JOIN"\
                                  " taxon_counts ON taxon_counts.count_type = taxon_summaries.count_type"\
                                  " AND taxon_counts.tax_level = taxon_summaries.tax_level"\
                                  " AND taxon_counts.tax_id = taxon_summaries.tax_id"\
                                  " AND taxon_counts.pipeline_run_id = #{pipeline_run_id}")
                                .where(
                                  taxon_summaries: {
                                    background_id: background_id,
                                    tax_id: tax_ids,
                                    tax_level: [TaxonCount::TAX_LEVEL_SPECIES, TaxonCount::TAX_LEVEL_GENUS],
                                    count_type: ['NT', 'NR'],
                                  },
                                  taxon_counts: {
                                    count: nil,
                                  }
                                )
                                .where.not(
                                  taxon_summaries: {
                                    tax_id: [
                                      TaxonLineage::BLACKLIST_GENUS_ID,
                                      TaxonLineage::HOMO_SAPIENS_TAX_IDS,
                                    ].flatten,
                                  }
                                )

    taxon_count_fields = get_taxon_count_fields_to_pluck(technology)

    taxons_absent_from_sample.pluck(*(taxon_count_fields + TAXON_SUMMARY_FIELDS_TO_PLUCK))
  end

  def split_by_tax_level(counts_array, field_index)
    return counts_array.group_by { |entry| entry[field_index[:tax_level]] }
  end

  def hash_by_tax_id_and_count_type(counts_array, field_index)
    counts_hash = {}
    counts_array.each do |counts|
      tax_id = counts[field_index[:tax_id]]

      counts_hash[tax_id] ||= {
        genus_tax_id: counts[field_index[:genus_taxid]],
        name: counts[field_index[:name]],
        common_name: counts[field_index[:common_name]],
        category: TaxonLineage::CATEGORIES[counts[field_index[:superkingdom_taxid]]],
      }
      if counts[field_index[:is_phage]] == 1
        counts_hash[tax_id][:subcategories] = ["phage"]
        counts_hash[tax_id][:is_phage] = true
      else
        counts_hash[tax_id][:is_phage] = false
      end

      count_per_million_key = @technology == PipelineRun::TECHNOLOGY_INPUT[:illumina] ? :rpm : :bpm
      count_per_million_decimal_key = @technology == PipelineRun::TECHNOLOGY_INPUT[:illumina] ? :rpm_decimal : :bpm
      if @use_decimal_columns
        percent_identity = counts[field_index[:percent_identity_decimal]].to_f
        alignment_length = counts[field_index[:alignment_length_decimal]].to_f
        count_per_million = counts[field_index[count_per_million_decimal_key]].to_f
      else
        percent_identity = counts[field_index[:percent_identity]]
        alignment_length = counts[field_index[:alignment_length]]
        count_per_million = counts[field_index[count_per_million_key]]
      end

      count_type = counts[field_index[:count_type]].downcase.to_sym
      counts_hash[tax_id][count_type] = {
        :count => counts[field_index[:count]],
        :e_value => counts[field_index[:e_value]],
        :source_count_type => counts[field_index[:source_count_type]],
        :percent_identity => percent_identity,
        :alignment_length => alignment_length,
        count_per_million_key => count_per_million,
      }
      include_base_count = @technology == PipelineRun::TECHNOLOGY_INPUT[:nanopore]
      counts_hash[tax_id][count_type][:base_count] = counts[field_index[:base_count]] if include_base_count

      unless count_type == :merged_nt_nr
        counts_hash[tax_id][count_type].merge!({
                                                 bg_mean: counts[field_index[:mean]],
                                                 bg_stdev: counts[field_index[:stdev]],
                                                 bg_mean_mass_normalized: counts[field_index[:mean_mass_normalized]],
                                                 bg_stdev_mass_normalized: counts[field_index[:stdev_mass_normalized]],
                                               })
      end
    end
    return counts_hash
  end

  def merge_contigs(contigs, counts_by_tax_level)
    # Using "rb" as shorthand for "reads or bases"
    contig_rb_key = @technology == PipelineRun::TECHNOLOGY_INPUT[:illumina] ? :contig_r : :contig_b
    contigs.each do |tax_id, contigs_per_db_type|
      contigs_per_db_type.each do |db_type, contigs_per_rb_count|
        norm_count_type = db_type.downcase.to_sym
        counts_per_db_type = counts_by_tax_level.dig(TaxonCount::TAX_LEVEL_SPECIES, tax_id, norm_count_type)
        counts_per_db_type ||= counts_by_tax_level.dig(TaxonCount::TAX_LEVEL_GENUS, tax_id, norm_count_type)

        if counts_per_db_type
          contigs = 0
          contig_rb = 0
          contigs_per_rb_count.each do |rb, count|
            contigs += count
            contig_rb += count * rb
          end
          counts_per_db_type[:contigs] = contigs
          counts_per_db_type[contig_rb_key] = contig_rb
        else
          # TODO(tiago): not sure if this case ever happens
          Rails.logger.warn("[PR=#{@pipeline_run.id}] PR has contigs but not taxon counts for taxon #{tax_id} in #{db_type}: #{contigs_per_rb_count}")
        end
      end
    end
  end

  def compute_count_per_million(count_types:, taxa_counts:, total_count:)
    taxa_counts.each_value do |taxon_counts|
      count_types.each do |type|
        if taxon_counts[type].present?
          count_key = @technology == PipelineRun::TECHNOLOGY_INPUT[:illumina] ? :count : :base_count
          count_per_million = taxon_counts[type][count_key] * 1E6 / total_count
          if @technology == PipelineRun::TECHNOLOGY_INPUT[:illumina]
            taxon_counts[type][:rpm] = count_per_million
          elsif @technology == PipelineRun::TECHNOLOGY_INPUT[:nanopore]
            taxon_counts[type][:bpm] = count_per_million
          end
        end
      end
    end
  end

  def compute_z_score_mass_normalized(
    count,
    mean_mass_normalized,
    stdev_mass_normalized,
    total_ercc_reads,
    min_z_score = Z_SCORE_MIN,
    max_z_score = Z_SCORE_MAX,
    absent_z_score = Z_SCORE_WHEN_ABSENT_FROM_BACKGROUND
  )
    return absent_z_score unless stdev_mass_normalized && (total_ercc_reads > 0)

    if @technology == PipelineRun::TECHNOLOGY_INPUT[:illumina]
      count_mass_normalized = count / total_ercc_reads.to_f
    elsif @technology == PipelineRun::TECHNOLOGY_INPUT[:nanopore]
      count_mass_normalized = count
    end

    value = (count_mass_normalized - mean_mass_normalized) / stdev_mass_normalized
    value.clamp(min_z_score, max_z_score)
  end

  def compute_z_score_standard(
    count_per_million,
    mean,
    stdev,
    min_z_score = Z_SCORE_MIN,
    max_z_score = Z_SCORE_MAX,
    absent_z_score = Z_SCORE_WHEN_ABSENT_FROM_BACKGROUND
  )
    return absent_z_score unless stdev

    value = (count_per_million - mean) / stdev
    value.clamp(min_z_score, max_z_score)
  end

  def compute_z_scores(taxa_counts)
    # ************************************************************
    # This computation is also performed in the taxon-indexing lambda:
    # https://github.com/chanzuckerberg/idseq/blob/main/lambdas/taxon-indexing/chalicelib/queries.py
    # Please ensure that any updates made here are also done there.
    # ************************************************************
    taxa_counts.each_value do |taxon_counts|
      if @background
        if @background.mass_normalized?
          nt_z_score = compute_z_score_mass_normalized(taxon_counts[:nt][:count], taxon_counts[:nt][:bg_mean_mass_normalized], taxon_counts[:nt][:bg_stdev_mass_normalized], @pipeline_run.total_ercc_reads) if taxon_counts[:nt].present?
          nr_z_score = compute_z_score_mass_normalized(taxon_counts[:nr][:count], taxon_counts[:nr][:bg_mean_mass_normalized], taxon_counts[:nr][:bg_stdev_mass_normalized], @pipeline_run.total_ercc_reads) if taxon_counts[:nr].present?
        else
          count_per_million_key = @technology == PipelineRun::TECHNOLOGY_INPUT[:illumina] ? :rpm : :bpm
          nt_z_score = compute_z_score_standard(taxon_counts[:nt][count_per_million_key], taxon_counts[:nt][:bg_mean], taxon_counts[:nt][:bg_stdev]) if taxon_counts[:nt].present?
          nr_z_score = compute_z_score_standard(taxon_counts[:nr][count_per_million_key], taxon_counts[:nr][:bg_mean], taxon_counts[:nr][:bg_stdev]) if taxon_counts[:nr].present?
        end
        taxon_counts[:nt][:z_score] = nt_z_score if taxon_counts[:nt].present?
        taxon_counts[:nr][:z_score] = nr_z_score if taxon_counts[:nr].present?
        taxon_counts[:nt][:z_score] = taxon_counts[:nt][:count] != 0 ? nt_z_score : Z_SCORE_WHEN_ABSENT_FROM_SAMPLE if taxon_counts[:nt].present?
        taxon_counts[:nr][:z_score] = taxon_counts[:nr][:count] != 0 ? nr_z_score : Z_SCORE_WHEN_ABSENT_FROM_SAMPLE if taxon_counts[:nr].present?
        taxon_counts[:max_z_score] = nr_z_score.nil? || (nt_z_score && nt_z_score > nr_z_score) ? nt_z_score : nr_z_score
      else
        taxon_counts[:nt][:z_score] = nil if taxon_counts[:nt].present?
        taxon_counts[:nr][:z_score] = nil if taxon_counts[:nr].present?
        taxon_counts[:max_z_score] = nil
      end
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

      if @background
        count_per_million_key = @technology == PipelineRun::TECHNOLOGY_INPUT[:illumina] ? :rpm : :bpm
        from_nt = species[:nt].present? ? genus_nt_zscore.abs * species[:nt][:z_score] * species[:nt][count_per_million_key] : 0
        from_nr = species[:nr].present? ? genus_nr_zscore.abs * species[:nr][:z_score] * species[:nr][count_per_million_key] : 0
        species[:agg_score] = from_nt + from_nr

        genus[:agg_score] = species[:agg_score] if genus[:agg_score].nil? || genus[:agg_score] < species[:agg_score]
      else
        species[:agg_score] = nil
        genus[:agg_score] = nil
      end
    end
  end

  def add_children_species_to_genus(species_counts, genus_counts)
    species_counts.each do |tax_id, species|
      genus = genus_counts[species[:genus_tax_id]]
      if !genus[:species_tax_ids]
        genus[:species_tax_ids] = [tax_id]
      else
        genus[:species_tax_ids].append(tax_id)
      end
    end
  end

  def encode_taxon_lineage(lineage_by_tax_id)
    structured_lineage = {}
    ranks = ["superkingdom", "kingdom", "phylum", "class", "order", "family", "genus", "species"]
    lineage_by_tax_id.each do |base_tax_id, lineage|
      tax_lineage_key = nil
      ranks.each do |rank|
        tax_id = lineage["#{rank}_taxid"]
        new_tax_lineage_key = if tax_id < 0
                                tax_lineage_key.nil? ? tax_id.to_s : "#{tax_lineage_key}_#{tax_id}"
                              else
                                tax_id
                              end

        unless structured_lineage.key?(new_tax_lineage_key)
          structured_lineage[new_tax_lineage_key] = {
            name: lineage["#{rank}_name"],
            parent: tax_lineage_key,
            rank: rank,
          }
        end
        tax_lineage_key = new_tax_lineage_key

        # do not process below the rank that this lineage start with
        # necessary because we might have lineages for both species and genus
        break if tax_id == base_tax_id
      end
    end
    return structured_lineage
  end

  def sort_genus_tax_ids(counts_by_tax_level, field)
    return counts_by_tax_level[TaxonCount::TAX_LEVEL_GENUS]
           .values
           .reject { |genus| genus[:genus_tax_id].nil? }
           .sort_by { |genus| genus[field] }
           .pluck(:genus_tax_id)
           .reverse!
  end

  def find_species_to_highlight(sorted_genus_tax_ids, counts_by_tax_level)
    # For ont_v1, we will not be highlighting any species-level taxa
    return [] unless @technology == PipelineRun::TECHNOLOGY_INPUT[:illumina]

    meets_highlight_condition = lambda do |tax_id, counts|
      return (counts.dig(:nt, :rpm) || 0) > UI_HIGHLIGHT_MIN_NT_RPM \
        && (counts.dig(:nr, :rpm) || 0) > UI_HIGHLIGHT_MIN_NR_RPM \
        && (counts.dig(:nt, :z_score) || 0) > UI_HIGHLIGHT_MIN_NT_Z \
        && (counts.dig(:nr, :z_score) || 0) > UI_HIGHLIGHT_MIN_NR_Z \
        && tax_id > 0
    end

    highlighted_tax_ids = []
    sorted_genus_tax_ids.each do |genus_tax_id|
      genus_taxon = counts_by_tax_level[TaxonCount::TAX_LEVEL_GENUS][genus_tax_id]
      genus_taxon[:species_tax_ids].each do |species_tax_id|
        return highlighted_tax_ids if highlighted_tax_ids.length >= UI_HIGHLIGHT_TOP_N

        species_taxon = counts_by_tax_level[TaxonCount::TAX_LEVEL_SPECIES][species_tax_id]
        if meets_highlight_condition.call(species_tax_id, species_taxon)
          highlighted_tax_ids << species_tax_id
        end
      end
    end
    return highlighted_tax_ids
  end

  def flag_annotations(sorted_genus_tax_ids, counts_by_tax_level)
    return unless @show_annotations

    genus_tax_map = counts_by_tax_level[TaxonCount::TAX_LEVEL_GENUS]
    species_tax_map = counts_by_tax_level[TaxonCount::TAX_LEVEL_SPECIES]
    tax_ids = genus_tax_map.keys + species_tax_map.keys

    annotations_by_tax_id = Annotation.fetch_annotations_by_tax_id(tax_ids, @pipeline_run.id)

    # Empty hash mapping annotation content => count, ie. { hit: 0, not_a_hit: 0, inconclusive: 0 }
    empty_annotation_counts = Annotation.contents.keys.index_with { |_c| 0 }

    sorted_genus_tax_ids.each do |genus_tax_id|
      species_annotation_counts = empty_annotation_counts.dup

      # Store genus-level annotation (or null if genus is not annotated)
      genus_taxon = genus_tax_map[genus_tax_id]
      genus_taxon['annotation'] = annotations_by_tax_id[genus_tax_id]

      genus_taxon[:species_tax_ids].each do |species_tax_id|
        # Store species-level annotation (or null if species is not annotated)
        species_taxon = species_tax_map[species_tax_id]
        species_annotation_content = annotations_by_tax_id[species_tax_id]
        species_taxon['annotation'] = species_annotation_content

        if species_annotation_content.present?
          species_annotation_counts[species_annotation_content] += 1
        end
      end
      # Store species annotation counts, ie. { hit: 1, not_a_hit: 0, inconclusive: 0 }
      genus_taxon['species_annotations'] = species_annotation_counts
    end
  end

  def flag_pathogens(species_counts:)
    known_pathogens = PathogenList.find_by(is_global: true).fetch_list_version().fetch_pathogens_info().pluck(:tax_id)

    species_counts.each do |tax_id, tax_info|
      if tax_id.in?(known_pathogens)
        tax_info['pathogenFlags'] = [FLAG_KNOWN_PATHOGEN]
        # for backwards compatibility with older feature flags
        tax_info['pathogenFlag'] = FLAG_KNOWN_PATHOGEN
      end
    end
  end

  def report_csv(counts, sorted_genus_tax_ids)
    rows = []

    # If there are no genus taxids (due to there being no taxon counts), return empty string.
    if sorted_genus_tax_ids.nil?
      return ""
    end

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
    rows = rows.map { |row| row.map { |k, v| [k.map(&:to_s).join("_"), v] }.to_h }

    CSVSafe.generate(headers: true) do |csv|
      columns = CSV_COLUMNS[@technology]

      csv << columns
      rows.each do |tax_info|
        # e_value is stored as the base 10 log of the actual value, but for a
        # csv report we want to give the full direct value
        tax_info["nt_e_value"] = tax_info["nt_e_value"].nil? ? nil : "10^#{tax_info['nt_e_value']}"
        tax_info["nr_e_value"] = tax_info["nr_e_value"].nil? ? nil : "10^#{tax_info['nr_e_value']}"

        # Pathogen tags: for a genus, consider all its species rows; for a species, consider only itself
        rows_to_consider = if tax_info["species_tax_ids"]
                             rows.select { |r| tax_info["species_tax_ids"].include?(r["tax_id"]) }
                           else
                             [tax_info]
                           end

        # Count up the number of species that are known pathogen
        tax_info["known_pathogen"] = 0
        rows_to_consider.each do |row|
          if row["pathogenFlag"] == FLAG_KNOWN_PATHOGEN || (row["pathogenFlags"] || []).include?(FLAG_KNOWN_PATHOGEN)
            tax_info["known_pathogen"] += 1
          end
        end

        csv << tax_info.values_at(*columns)
      end
    end
  end

  # Example cache key:
  # /samples/12303/report_v2.json?background_id=93&format=json&pipeline_version=3.3&report_ts=1549504990&pipeline_run_id=39185
  def self.report_info_cache_key(path, kvs)
    kvs = kvs.to_h.sort.to_h
    # Increment this if you ever change the response structure of report_info
    kvs["_cache_key_version"] = 3
    path + "?" + kvs.to_param
  end
end
