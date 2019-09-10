require 'oj'

class SampleReportService
  FIELDS_TO_PLUCK = [
    :tax_id,
    :genus_taxid,
    :count_type,
    :tax_level,
    :count,
    :mean,
    :stdev,
    :name # name needed for taxon scoring model?!
  ].freeze

  FIELDS_INDEX = Hash[FIELDS_TO_PLUCK.map.with_index { |field, i| [field, i] }]

  Z_SCORE_MIN = -99
  Z_SCORE_MAX =  99
  Z_SCORE_WHEN_ABSENT_FROM_BACKGROUND = 100

  def initialize(pipeline_run_id, background_id)
    @pipeline_run_id = pipeline_run_id
    @background_id = background_id
  end

  def generate
    timer("total_generation") do
      lab_generate
    end
  end

  def lab_generate
    taxon_counts_and_summaries_query = nil
    taxon_counts_and_summaries = nil
    counts_by_tax_level = nil
    pipeline_run = nil
    adjusted_total_reads = nil
    lineage_by_tax_id = nil
    structured_lineage = {}

    timer("initialize and adjust reads") do
      pipeline_run = PipelineRun.find(@pipeline_run_id)
      adjusted_total_reads = (pipeline_run.total_reads - pipeline_run.total_ercc_reads.to_i) * pipeline_run.subsample_fraction
    end

    timer("query_counts_and_summaries (should be fast)") do
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
    end

    timer("pluck_counts_and_summaries") do
      taxon_counts_and_summaries = taxon_counts_and_summaries_query.pluck(*FIELDS_TO_PLUCK)
      # puts "Count of summaries and counts: #{taxon_counts_and_summaries.count}"
    end

    timer("split_by_tax_level") do
      counts_by_tax_level = split_by_tax_level(taxon_counts_and_summaries)
      # puts "BEFORE INDEXING"
      # counts_by_tax_level.each do |level, counts|
      #   puts "[level] #{level} -> #{counts.count}"
      # end
      # puts "[TOTAL] #{counts_by_tax_level.values.map{|v| v.count}.sum}"
    end

    # Not formatted enough...
    # timer("index_by_tax_id") do
    #   counts_by_tax_level.transform_values { |counts| hash_by_tax_id(counts) }
    #   puts "AFTER INDEXING"
    #   counts_by_tax_level.each do |level, counts|
    #     puts "[level] #{level} -> #{counts.count}"
    #   end
    #   puts "[TOTAL] #{counts_by_tax_level.values.map{|v| v.count}.sum}"
    # end

    timer("index_by_tax_id_and_count_type") do
      counts_by_tax_level.transform_values! { |counts| hash_by_tax_id_and_count_type(counts) }
      # puts "AFTER INDEXING BY COUNT_TYPE"
      # counts_by_tax_level.each do |level, counts|
      #   puts "[level] #{level} -> #{counts.count}"
      # end
      # puts "[TOTAL] #{counts_by_tax_level.values.map{|v| v.count}.sum}"
    end

    timer("compute_z_scores") do
      counts_by_tax_level.each_value do |tax_level_taxa|
        compute_z_scores(tax_level_taxa, adjusted_total_reads)
      end
      # print(counts_by_tax_level)
    end

    timer("compute agg scores") do
      compute_aggregate_scores(
        counts_by_tax_level[TaxonCount::TAX_LEVEL_SPECIES],
        counts_by_tax_level[TaxonCount::TAX_LEVEL_GENUS]
      )
    end

    timer("fetch genus lineage") do
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
    end

    timer("encode taxon lineage") do
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

    # puts "len of table: #{Oj.dump(counts_by_tax_level).length}"
    # puts "len of lineage: #{Oj.dump(structured_lineage).length}"
    # puts "len of unstructured lineage: #{Oj.dump(lineage_by_tax_id).length}"

    # puts counts_by_tax_level.keys
    # TODO: sort by custom field
    sorted_genus_tax_ids = timer("sort genus by aggregate score") do
      counts_by_tax_level[TaxonCount::TAX_LEVEL_GENUS]
        .values
        .sort_by { |genus| genus[:agg_score] }
        .map { |genus| genus[:genus_tax_id] }
        .reverse!
    end

    timer("sort species within each genus") do
      counts_by_tax_level[TaxonCount::TAX_LEVEL_GENUS].transform_values! do |genus|
        genus[:children].sort_by { |species_id| counts_by_tax_level[TaxonCount::TAX_LEVEL_SPECIES][species_id][:agg_score] }.reverse!
        genus
      end
    end

    # # OJ often showed >x2 faster performance
    # timer("convert to json with OJ") do
    #   json_result = Oj.dump(
    #     counts: counts_by_tax_level,
    #     lineage: structured_lineage,
    #     sorted_genus: sorted_genus_tax_ids
    #   )
    #   # puts "len of json: #{json_result.length}"
    #   json_result
    # end

    # DO NOT USE
    json_dump = timer("convert to json with JSON") do
      JSON.dump(
        counts: counts_by_tax_level,
        lineage: structured_lineage,
        sortedGenus: sorted_genus_tax_ids
      )
    end

    return json_dump
    # DEFINITELY DO NOT USE
    # return timer("convert to json") do
    #   counts_by_tax_level.to_json
    # end
  end

  def split_by_tax_level(counts_array)
    return counts_array.group_by { |entry| entry[FIELDS_INDEX[:tax_level]] }
  end

  def hash_by_tax_id(counts_array)
    return counts_array.group_by { |entry| entry[FIELDS_INDEX[:tax_id]] }
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
        bg_mean: counts[FIELDS_INDEX[:mean]],
        bg_stdev: counts[FIELDS_INDEX[:stdev]],
      }
    end
    return counts_hash
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
      taxon_counts[:max_z_score] = nr_z_score.nil? || (nt_z_score && nt_z_score > nr_z_score) ? nt_z_score : nr_z_score
    end
  end

  def compute_aggregate_scores(species_counts, genus_counts)
    species_counts.each do |tax_id, species|
      genus = genus_counts[species[:genus_tax_id]]
      species[:agg_score] = (species[:nt].present? ? genus[:nt][:z_score].abs * species[:nt][:z_score] * species[:nt][:rpm] : 0) \
        + (species[:nr].present? ? genus[:nr][:z_score].abs * species[:nr][:z_score] * species[:nr][:rpm] : 0)
      genus[:agg_score] = species[:agg_score] if genus[:agg_score].nil? || genus[:agg_score] < species[:agg_score]
      # TODO : more this to a more logical place
      if !genus[:children]
        genus[:children] = [tax_id]
      else
        genus[:children].append(tax_id)
      end
    end
  end

  # def compute_species_aggregate_scores_from_db(species_counts, genus_counts)
  #   # TODO : currently this does not work due to a mismatch of the format
  #   # This should be used for development only...
  #   scoring_model ||= TaxonScoringModel::DEFAULT_MODEL_NAME
  #   tsm = TaxonScoringModel.find_by(name: scoring_model)
  #   species_counts.each_value do |species|
  #     # puts "tax_id=#{tax_id}"
  #     # puts "species=#{species}"
  #     # puts species[:genus_tax_id]
  #     # puts species[:genus_tax_id].class
  #     # puts "genus=#{genus_counts[species[:genus_tax_id]]}"
  #     agg_score = tsm.score(
  #       genus: genus_counts[species[:genus_tax_id]],
  #       species: species
  #     )
  #     species['agg_score'] = agg_score
  #     # puts(agg_score)
  #     # species_info['NT']['maxzscore'] = [species_info['NT']['zscore'], species_info['NR']['zscore']].max
  #     # species_info['NR']['maxzscore'] = species_info['NT']['maxzscore']
  #     # next unless species_info['tax_level'] == TaxonCount::TAX_LEVEL_SPECIES
  #     # genus_id = species_info['genus_taxid']
  #     # genus_info = tax_2d[genus_id]
  #     # taxon_info = { "genus" => genus_info, "species" => species_info }
  #     # species_score = tsm.score(taxon_info)
  #     # species_info['NT']['aggregatescore'] = species_score.to_f
  #     # species_info['NR']['aggregatescore'] = species_score.to_f
  #   end
  # end
end

def timer(name)
  starting = Process.clock_gettime(Process::CLOCK_MONOTONIC)
  result = yield
  ending = Process.clock_gettime(Process::CLOCK_MONOTONIC)
  elapsed = ending - starting
  Rails.logger.debug("TIMER[#{name}]: #{elapsed}")
  result
end

# TODO: checklist below
# Check blacklist genus ids

# * compute filter/sorted values in ruby
# * compute filter/sorted values in sql
# * compare
# * filter only genus and species levels

# * DONE: get number of rows for this sample after initial query (fetch_taxon_counts) -> 18705 for a final total of 14229
# * get json format to replicate

# refresh: why do we more than need genus and species level - hit calling? - apart referred there should not be an issue
# remove fields common name -> do we need them?

# Questions:
# * What is TaxonLineage::MISSING_SPECIES_ID for non species level organisms (see ReportHelper:cleanup_genus_ids)?
# * TaxonLineage::BLACKLIST_GENUS_ID is filtered out in the query and still gets an if in ReportHelper:validate_names...
# * What is the significance of an organism being in much less quantity in sample than in the background? If significant, should other bg elements show up?
