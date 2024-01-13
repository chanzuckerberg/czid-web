require 'csv'
require 'open3'

# TODO: (gdingle): this class should be split up. Everything needed for
# report_info_json should be extract into its own class and have its own
# unit tests. I'm not sure about the rest.
module ReportHelper
  # Truncate report table past this number of rows.
  ZSCORE_MIN = -99
  ZSCORE_MAX =  99
  ZSCORE_WHEN_ABSENT_FROM_SAMPLE = -100
  ZSCORE_WHEN_ABSENT_FROM_BACKGROUND = 100

  DEFAULT_SAMPLE_LOGEVALUE = 0.0
  DEFAULT_SAMPLE_PERCENTIDENTITY = 0.0
  DEFAULT_SAMPLE_ALIGNMENTLENGTH = 0.0

  DECIMALS = 7

  SORT_DIRECTIONS = %w[highest lowest].freeze
  # We do not allow underscores in metric names, sorry!
  METRICS = {
    WorkflowRun::WORKFLOW[:short_read_mngs] => %w[r rpm zscore percentidentity alignmentlength logevalue aggregatescore maxzscore r_pct rpm_bg],
    WorkflowRun::WORKFLOW[:long_read_mngs] => %w[b r bpm percentidentity alignmentlength logevalue],
  }.freeze
  COUNT_TYPES = %w[NT NR].freeze
  # Note: no underscore in sortable column names. Add to here to protect from data cleaning.
  PROPERTIES_OF_TAXID = %w[tax_id name common_name tax_level species_taxid genus_taxid genus_name family_taxid superkingdom_taxid category_name is_phage].freeze

  # This query takes 1.4 seconds and the results are static, so we hardcoded it
  # mysql> select distinct(superkingdom_taxid) as taxid, IF(superkingdom_name IS NOT NULL, superkingdom_name, 'Uncategorized') as name from taxon_lineages;
  # +-------+---------------+
  # | taxid | name          |
  # +-------+---------------+
  # |  -700 | Uncategorized |
  # |     2 | Bacteria      |
  # |  2157 | Archaea       |
  # |  2759 | Eukaryota     |
  # | 10239 | Viruses       |
  # | 12884 | Viroids       |
  # +-------+---------------+
  ALL_CATEGORIES = [
    { 'taxid' => 2, 'name' => "Bacteria" },
    { 'taxid' => 2157, 'name' => "Archaea" },
    { 'taxid' => 2759, 'name' => "Eukaryota" },
    { 'taxid' => 10_239, 'name' => "Viruses" },
    { 'taxid' => 12_884, 'name' => "Viroids" },
    { 'taxid' => TaxonLineage::MISSING_SUPERKINGDOM_ID, 'name' => "Uncategorized" },
  ].freeze
  CATEGORIES_TAXID_BY_NAME = ALL_CATEGORIES.map { |category| { category['name'] => category['taxid'] } }.reduce({}, :merge)

  # use the metric's NT <=> NR dual as a tertiary sort key (so, for example,
  # when you sort by NT R, entries without NT R will be ordered amongst
  # themselves based on their NR R (as opposed to arbitrary ordder);
  # and within the Z, for things with equal Z, use the R as tertiary
  OTHER_COUNT_TYPE = {
    'NT' => 'NR',
    'NR' => 'NT',
  }.freeze
  OTHER_METRIC = {
    'zscore' => 'r',
    'r' => 'zscore',
    'rpm' => 'zscore',
  }.freeze

  # TODO: (gdingle): refactor to class method
  def generate_heatmap_csv(sample_taxa_hash, background_id, pathogen_flags_by_sample = nil)
    attribute_names = [
      "sample_name",
      "tax_id",
      "genus_name",
      "taxon_name",
      "aggregatescore",
      "NT_r",
      "NT_rpm",
      "NT_zscore",
      "NR_r",
      "NR_rpm",
      "NR_zscore",
      *("known_pathogen" if pathogen_flags_by_sample),
      *("lcrp_pathogen" if pathogen_flags_by_sample),
      *("divergent_pathogen" if pathogen_flags_by_sample),
    ]
    CSVSafe.generate(headers: true) do |csv|
      csv << attribute_names
      (sample_taxa_hash || []).each do |sample_record|
        (sample_record[:taxons] || []).each do |taxon_record|
          data_values = { sample_name: sample_record[:name],
                          tax_id: taxon_record["tax_id"],
                          genus_name: taxon_record["genus_name"],
                          taxon_name: taxon_record["name"],
                          aggregatescore: (taxon_record["NT"] || {})["aggregatescore"],
                          NT_r: (taxon_record["NT"] || {})["r"],
                          NT_rpm: (taxon_record["NT"] || {})["rpm"],
                          NT_zscore: (taxon_record["NT"] || {})["zscore"],
                          NR_r: (taxon_record["NR"] || {})["r"],
                          NR_rpm: (taxon_record["NR"] || {})["rpm"],
                          NR_zscore: (taxon_record["NR"] || {})["zscore"], }
          unless pathogen_flags_by_sample.nil?
            flags = pathogen_flags_by_sample.dig(sample_record[:sample_id], taxon_record["tax_id"]) || []
            data_values[:known_pathogen] = flags.include?(PipelineReportService::FLAG_KNOWN_PATHOGEN) ? 1 : 0
            data_values[:lcrp_pathogen] = flags.include?(PipelineReportService::FLAG_LCRP) ? 1 : 0
            data_values[:divergent_pathogen] = flags.include?(PipelineReportService::FLAG_DIVERGENT) ? 1 : 0
          end
          csv << data_values.values_at(*attribute_names.map(&:to_sym))
        end
      end
      unless background_id.nil?
        background_name = Background.find(background_id)&.name
        csv << ["Background: #{background_name}"]
      end
    end
  end

  # TODO: (gdingle): refactor to class method
  def select_pipeline_run(sample, pipeline_version)
    if pipeline_version.to_f > 0.0
      sample.pipeline_run_by_version(pipeline_version)
    else
      sample.first_pipeline_run
    end
  end

  # All the methods below should be considered private, but I don't know enough
  # about ruby to actually make a class method private and call it.
  # private

  def self.decode_sort_by(sort_by)
    return nil unless sort_by

    parts = sort_by.split "_"
    return nil unless parts.length == 3

    direction = parts[0]
    return nil unless SORT_DIRECTIONS.include? direction

    count_type = parts[1].upcase
    return nil unless COUNT_TYPES.include? count_type

    metric = parts[2]
    return nil unless METRICS[WorkflowRun::WORKFLOW[:short_read_mngs]].include? metric

    {
      direction: direction,
      count_type: count_type,
      metric: metric,
    }
  end

  def self.zero_metrics(count_type, workflow)
    if workflow == WorkflowRun::WORKFLOW[:short_read_mngs]
      {
        'count_type' => count_type,
        'r' => 0,
        'rpm' => 0,
        'zscore' => ZSCORE_WHEN_ABSENT_FROM_SAMPLE,
        'percentidentity' => DEFAULT_SAMPLE_PERCENTIDENTITY,
        'alignmentlength' => DEFAULT_SAMPLE_ALIGNMENTLENGTH,
        'logevalue' => DEFAULT_SAMPLE_LOGEVALUE,
        'aggregatescore' => nil,
      }
    elsif workflow == WorkflowRun::WORKFLOW[:long_read_mngs]
      {
        'count_type' => count_type,
        'b' => 0,
        'r' => 0,
        'bpm' => 0,
        'percentidentity' => DEFAULT_SAMPLE_PERCENTIDENTITY,
        'alignmentlength' => DEFAULT_SAMPLE_ALIGNMENTLENGTH,
        'logevalue' => DEFAULT_SAMPLE_LOGEVALUE,
      }
    end
  end

  def self.tax_info_base(taxon, workflow)
    tax_info_base = {}
    PROPERTIES_OF_TAXID.each do |prop|
      tax_info_base[prop] = taxon[prop]
    end
    COUNT_TYPES.each do |count_type|
      tax_info_base[count_type] = zero_metrics(count_type, workflow)
    end
    tax_info_base
  end

  def self.metric_props(taxon, workflow)
    metric_props = zero_metrics(taxon['count_type'], workflow)
    METRICS[workflow].each do |metric|
      metric_props[metric] = taxon[metric].round(DECIMALS) if taxon[metric]
    end
    metric_props
  end

  def self.convert_2d(taxon_counts_from_sql, workflow)
    # Returns short-read-mngs data structured as
    #    tax_id => {
    #       tax_id,
    #       tax_level,
    #       genus_taxid,
    #       family_taxid,
    #       species_count,
    #       name,
    #       common_name,
    #       category_name,
    #       is_phage,
    #       NR => {
    #         count_type,
    #         r,
    #         rpm
    #         zscore
    #       }
    #       NT => {
    #         count_type,
    #         r,
    #         rpm
    #         zscore
    #       }
    #    }
    # Returns long-read-mngs data structured as above, but with bases NR/NT data
    #    tax_id => {
    #       ...
    #       NR => {
    #         count_type,
    #         b,
    #         bpm
    #       }
    #       NT => {
    #         count_type,
    #         b,
    #         bpm
    #       }
    #    }
    taxon_counts_2d = {}
    taxon_counts_from_sql.each do |t|
      taxon_counts_2d[t['tax_id']] ||= tax_info_base(t, workflow)
      taxon_counts_2d[t['tax_id']][t['count_type']] = metric_props(t, workflow)
    end
    taxon_counts_2d
  end

  def self.cleanup_genus_ids!(taxon_counts_2d)
    # We might rewrite the query to be super sure of this
    taxon_counts_2d.each do |tax_id, tax_info|
      # Fill in missing info since the pipeline doesn't yet emit these.
      tax_info['species_taxid'] = if tax_info['tax_level'] == TaxonCount::TAX_LEVEL_SPECIES
                                    tax_id
                                  else
                                    TaxonLineage::MISSING_SPECIES_ID
                                  end

      if tax_info['tax_level'] == TaxonCount::TAX_LEVEL_GENUS
        tax_info['genus_taxid'] = tax_id
      end
      if tax_info['tax_level'] == TaxonCount::TAX_LEVEL_FAMILY
        tax_info['family_taxid'] = tax_id
      end
    end
    taxon_counts_2d
  end

  def self.validate_names!(tax_2d)
    # This converts superkingdom_id to category_name and makes up
    # suitable names for missing and blacklisted genera and species. Such
    # made-up names should be lowercase so they are sorted below proper names.
    category = {}
    ALL_CATEGORIES.each do |c|
      category[c['taxid']] = c['name']
    end
    missing_names = Set.new
    missing_parents = {}

    tax_2d.each do |tax_id, tax_info|
      level_str = TaxonLineage.level_name(tax_info['tax_level'])
      if tax_id < 0
        # Usually -1 means accession number did not resolve to species.
        # TODO: Can we keep the accession numbers to show in these cases?
        # NOTE: important to be lowercase for sorting below uppercase valid genuses
        tax_info['name'] = "all taxa with neither family nor genus classification"

        if tax_id < TaxonLineage::INVALID_CALL_BASE_ID && species_or_genus(tax_info['tax_level'])
          parent_id = convert_neg_taxid(tax_id)
          if tax_2d[parent_id]
            parent_name = tax_2d[parent_id]['name']
            parent_level = TaxonLineage.level_name(tax_2d[parent_id]['tax_level'])
          else
            missing_parents[parent_id] = tax_id
            parent_name = "taxon #{parent_id}"
            parent_level = ""
          end
          tax_info['name'] = "non-#{level_str}-specific reads in #{parent_level} #{parent_name}"
        elsif tax_id == TaxonLineage::BLACKLIST_GENUS_ID
          tax_info['name'] = "all artificial constructs"
        elsif !TaxonLineage::MISSING_LINEAGE_ID.value?(tax_id) && tax_id != TaxonLineage::MISSING_SPECIES_ID_ALT
          tax_info['name'] += " #{tax_id}"
        end
      elsif !tax_info['name']
        missing_names.add(tax_id)
        tax_info['name'] = "unnamed #{level_str} taxon #{tax_id}"
      end
      category_id = tax_info.delete('superkingdom_taxid')
      tax_info['category_name'] = category[category_id] || 'Uncategorized'
    end

    Rails.logger.warn "Missing names for taxon ids #{missing_names.to_a}" unless missing_names.empty?
    Rails.logger.warn "Missing parent for child:  #{missing_parents}" unless missing_parents.empty?
    tax_2d
  end

  def self.remove_homo_sapiens_counts!(taxon_counts_2d)
    taxon_counts_2d.delete_if { |tax_id, _tax_info| TaxonLineage::HOMO_SAPIENS_TAX_IDS.include?(tax_id) }
  end

  def self.remove_zscore(taxon_counts_2d)
    taxon_counts_2d.each do |_, tax_info|
      tax_info["NT"]["zscore"] = nil
      tax_info["NR"]["zscore"] = nil
    end
  end

  def self.taxon_counts_cleanup(taxon_counts, workflow, should_remove_zscore = false)
    # convert_2d also does some filtering.
    tax_2d = convert_2d(taxon_counts, workflow)
    cleanup_genus_ids!(tax_2d)
    validate_names!(tax_2d)
    # Remove any rows that correspond to homo sapiens. These should be mostly
    # filtered out in the pipeline but occassionally a few slip through.
    remove_homo_sapiens_counts!(tax_2d)
    remove_zscore(tax_2d) if should_remove_zscore
    tax_2d
  end

  def self.convert_neg_taxid(tax_id)
    thres = TaxonLineage::INVALID_CALL_BASE_ID
    if tax_id < thres
      tax_id = -(tax_id % thres).to_i
    end
    tax_id
  end

  def self.species_or_genus(tid)
    tid == TaxonCount::TAX_LEVEL_SPECIES || tid == TaxonCount::TAX_LEVEL_GENUS
  end
end
