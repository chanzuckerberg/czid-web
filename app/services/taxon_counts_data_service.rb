class TaxonCountsDataService
  include Callable

  Z_SCORE_MIN = -99
  Z_SCORE_MAX = 99
  Z_SCORE_WHEN_ABSENT_FROM_BACKGROUND = 100

  SELECT_CLAUSE_RPM = "count / ((total_reads - COALESCE(total_ercc_reads, 0)) * COALESCE(fraction_subsampled, 1.0)) * 1000 * 1000".freeze
  SELECT_CLAUSE_Z_SCORE = "COALESCE(
    GREATEST(#{Z_SCORE_MIN}, LEAST(#{Z_SCORE_MAX},
      IF(
        mean_mass_normalized IS NULL,
        ((#{SELECT_CLAUSE_RPM}) - mean) / stdev,
        ((count/total_ercc_reads) - mean_mass_normalized) / stdev_mass_normalized)
    )),
    #{Z_SCORE_WHEN_ABSENT_FROM_BACKGROUND})".freeze

  DEFAULT_COUNT_TYPES = [TaxonCount::COUNT_TYPE_NT, TaxonCount::COUNT_TYPE_NR].freeze

  TAXON_COUNT_FIELDS_TO_PLUCK = [
    :alignment_length,
    :common_name,
    :count,
    :count_type,
    :family_taxid,
    :e_value,
    :genus_taxid,
    :is_phage,
    :name,
    :percent_identity,
    :pipeline_run_id,
    :source_count_type,
    :superkingdom_taxid,
    :tax_id,
    :tax_level,
    Arel.sql("#{SELECT_CLAUSE_RPM} AS rpm"),
  ].freeze

  TAXON_SUMMARY_FIELDS_TO_PLUCK = [
    :mean,
    :mean_mass_normalized,
    :stdev,
    :stdev_mass_normalized,
    Arel.sql("#{SELECT_CLAUSE_Z_SCORE} AS z_score"),
  ].freeze

  LINEAGE_FIELDS_TO_PLUCK = %w[
    taxid
    superkingdom_taxid kingdom_taxid phylum_taxid class_taxid order_taxid family_taxid genus_taxid species_taxid
    superkingdom_name kingdom_name phylum_name class_name order_name family_name genus_name species_name
  ].freeze

  def initialize(pipeline_run_ids:, taxon_ids: nil, background_id: nil, count_types: DEFAULT_COUNT_TYPES, include_lineage: false, lazy: false)
    @pipeline_run_ids = pipeline_run_ids
    @taxon_ids = taxon_ids
    @background_id = background_id
    @count_types = count_types
    @include_lineage = include_lineage
    @lazy = lazy
  end

  def call
    return generate(@lazy)
  end

  private

  def generate(lazy)
    fields = TAXON_COUNT_FIELDS_TO_PLUCK
    taxon_counts_query = TaxonCount.joins(:pipeline_run)

    if @background_id.present?
      taxon_counts_query = taxon_counts_query
                           .joins("LEFT JOIN"\
                            " taxon_summaries ON taxon_counts.count_type = taxon_summaries.count_type"\
                            " AND taxon_counts.tax_level = taxon_summaries.tax_level"\
                            " AND taxon_counts.tax_id = taxon_summaries.tax_id"\
                            " AND taxon_summaries.background_id = #{@background_id}")
      fields += TAXON_SUMMARY_FIELDS_TO_PLUCK
    end

    if @taxon_ids.present?
      taxon_counts_query = taxon_counts_query.where(tax_id: @taxon_ids)
    end

    taxon_counts_query = taxon_counts_query
                         .where(
                           pipeline_run_id: @pipeline_run_ids,
                           count_type: @count_types,
                           tax_level: [TaxonCount::TAX_LEVEL_SPECIES, TaxonCount::TAX_LEVEL_GENUS]
                         )
                         .where.not(
                           tax_id: [
                             TaxonLineage::BLACKLIST_GENUS_ID,
                             TaxonLineage::HOMO_SAPIENS_TAX_IDS,
                           ].flatten
                         )

    if @include_lineage.present?
      fields += LINEAGE_FIELDS_TO_PLUCK if @include_lineage.present?
      taxon_counts_query = taxon_counts_query
                           .joins(pipeline_run: :alignment_config)
                           .joins(:taxon_lineage)
                           .where('alignment_configs.lineage_version BETWEEN version_start AND version_end')
    end

    if lazy
      [taxon_counts_query, fields]
    else
      taxon_counts_query.pluck_to_hash(*fields)
    end
  end
end
