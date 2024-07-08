module ElasticsearchHelper
  # Limit maximum number of results for performance
  # Since we currently might filter by sample and/or project only after the ElasticSearch,
  # it should be large enough to avoid filtering everything out
  # TODO(tiago): Eventually, this filtering should be moved to ElasticSearch, at which point we should reduce the max value
  # (We can also move it to a parameter that clients of this functions can set)
  MAX_SEARCH_RESULTS = 50

  def prefix_match(model, field, prefix, condition)
    prefix = sanitize(prefix)
    search_params = { query: { query_string: { query: "#{prefix}*", analyze_wildcard: true, fields: [field] } } }
    results = if Rails.env.test?
                # Return all records. Tests can't use elasticsearch.
                # They focus on whether access control is enforced.
                model.all
              else
                model.__elasticsearch__.search(search_params).records
              end
    condition.each do |key, values|
      results = results.where(key => values)
    end
    results
  end

  def taxon_search(query, tax_levels = TaxonCount::NAME_2_LEVEL.keys, filters = {})
    return {} if Rails.env.test?

    query = sanitize(query)

    # sanitize tax_levels
    tax_levels = tax_levels.select { |l| TaxonCount::NAME_2_LEVEL[l] }

    matching_taxa = []
    taxon_ids = []

    ncbi_version = filters[:project_id] ? get_ncbi_version(filters[:project_id]) : AppConfigHelper.get_app_config(AppConfig::DEFAULT_ALIGNMENT_CONFIG_NAME)

    tax_levels.each do |level|
      # NOTE(tiago): We tried to use a query of type `match` before but did not work
      # with partial matching. The default analyzers (standard english) used to
      # index only creates full word terms. For partial matching to work, we
      # would have to re-index data using an n-gram analyzer. This would allows
      # us to support both fuzziness and wildcards.
      # Thus, we decided to stick with `query_string` and add wildcards to each
      # of the tokens for partial matching.
      # We might want to review this method, use `match` and re-index data using
      # n-gram analyzer if we ever want fuzziness+wildcard or if performance
      # of the search becomes an issue.
      # NOTE(tiago): We should revisit use of aggregations to guarantee uniqueness,
      # in particular if there are performance issues. Probably replace by extra constraints.
      #
      # tokenize query and add wildcards for partial matching

      tokens = query.scan(/\w+/).map { |t| "*#{t}*" }
      search_params = {
        size: ElasticsearchHelper::MAX_SEARCH_RESULTS,
        query: {
          query_string: {
            query: tokens.join(" "),
            fields: ["#{level}_name"],
            default_operator: "and",
          },
        },
        aggs: {
          distinct_taxa: {
            terms: {
              field: "#{level}_taxid",
              size: ElasticsearchHelper::MAX_SEARCH_RESULTS,
            },
          },
        },
      }
      search_response = TaxonLineage.search(search_params)
      search_taxon_ids = search_response.aggregations.distinct_taxa.buckets.pluck(:key)

      matching_taxa += fetch_taxon_data(search_taxon_ids, ncbi_version, level)
      taxon_ids += search_taxon_ids
    end
    taxon_ids = filter_by_samples(taxon_ids, filters[:samples]) if filters[:samples]
    taxon_ids = filter_by_project(taxon_ids, filters[:project_id]) if filters[:project_id]
    taxon_ids = filter_by_superkingdom(taxon_ids, filters[:superkingdom]) if filters[:superkingdom]
    taxon_ids = Set.new(taxon_ids)

    # Always remove homo sapiens from search, same as reports, because all homo sapiens
    # hits are supposed to removed upstream in the pipeline. See also remove_homo_sapiens_counts!
    taxon_ids = taxon_ids.delete_if { |tax_id| TaxonLineage::HOMO_SAPIENS_TAX_IDS.include?(tax_id) }

    return matching_taxa.select { |taxon| taxon_ids.include? taxon["taxid"] }
  end

  private

  def filter_by_samples(taxon_ids, samples)
    return samples
           .joins(:pipeline_runs, pipeline_runs: :taxon_counts)
           .where(pipeline_runs: { id: PipelineRun.joins(:sample).where(sample: samples, job_status: "CHECKED").group(:sample_id).select("MAX(`pipeline_runs`.id) AS id") })
           .where(taxon_counts: { tax_id: taxon_ids, count_type: ["NT", "NR"] })
           .where("`taxon_counts`.count > 0")
           .distinct(taxon_counts: :tax_id)
           .pluck(:tax_id)
  end

  def filter_by_project(taxon_ids, project_id)
    return filter_by_samples(taxon_ids, Sample.joins(:project).where(project: Project.where(id: project_id)))
  end

  def filter_by_superkingdom(taxon_ids, superkingdom)
    # filter TaxonLineage by superkingdom (ex: viruses, Bacteria) where taxid is in taxon_ids
    return TaxonLineage
           .where(taxid: taxon_ids)
           .where(superkingdom_name: superkingdom)
           .pluck(:taxid)
  end

  def sanitize(text)
    # Add \\ to escape special characters. Four \ to escape the backslashes.
    # Escape anything that isn't in "a-zA-Z0-9 ._|'/"
    text.gsub(%r{([^a-zA-Z0-9 ._|'\/])}, '\\\\\1') if text
  end

  def fetch_taxon_data(search_taxon_ids, ncbi_version, level)
    taxid_column, name_column = get_taxid_name_columns(level)

    pinned_version_date = Date.parse(ncbi_version)
    # Fetch all records for the given taxids within the date range
    all_records = TaxonLineage.where(taxid_column => search_taxon_ids)
                              .where("? >= version_start AND ? <= version_end", pinned_version_date, pinned_version_date)
                              .order("version_end DESC")

    # Ensure only unique records based on taxid, since the records are ordered by version_end in descending order,
    # this first occurrence will be the record with the most recent version_end for that taxid
    unique_records = all_records.uniq { |record| record.send(taxid_column) }

    formatted_results = unique_records.pluck(name_column, taxid_column).map do |name, taxid|
      {
        "title" => name,
        "description" => "Taxonomy ID: #{taxid}",
        "taxid" => taxid,
        "level" => level,
      }
    end

    formatted_results
  end

  def get_taxid_name_columns(level)
    # sanitize user input to prevent SQL injection
    case level
    when "species"
      taxid_column = "species_taxid"
      name_column = "species_name"
    when "genus"
      taxid_column = "genus_taxid"
      name_column = "genus_name"
    when "family"
      taxid_column = "family_taxid"
      name_column = "family_name"
    when "order"
      taxid_column = "order_taxid"
      name_column = "order_name"
    when "class"
      taxid_column = "class_taxid"
      name_column = "class_name"
    when "phylum"
      taxid_column = "phylum_taxid"
      name_column = "phylum_name"
    when "superkingdom"
      taxid_column = "superkingdom_taxid"
      name_column = "superkingdom_name"
    else
      raise "Invalid level"
    end
    return taxid_column, name_column
  end

  def get_ncbi_version(project_id)
    ProjectWorkflowVersion.find_by(project_id: project_id, workflow: AlignmentConfig::NCBI_INDEX).version_prefix
  end
end
