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
    results = if Rails.env == "test"
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
    return {} if Rails.env == "test"
    query = sanitize(query)

    # sanitize tax_levels
    tax_levels = tax_levels.select { |l| TaxonCount::NAME_2_LEVEL[l] }

    matching_taxa = []
    taxon_ids = []
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

      taxon_data = TaxonLineage
                   .where("#{level}_taxid" => search_taxon_ids)
                   .order(id: :desc)
                   .distinct("#{level}_taxid")
                   .pluck("#{level}_name", "#{level}_taxid")
                   .map do |name, taxid|
                     {
                       "title" => name,
                       "description" => "Taxonomy ID: #{taxid}",
                       "taxid" => taxid,
                       "level" => level,
                     }
                   end

      matching_taxa += taxon_data
      taxon_ids += search_taxon_ids
    end

    taxon_ids = filter_by_samples(taxon_ids, filters[:samples]) if filters[:samples]
    taxon_ids = filter_by_project(taxon_ids, filters[:project_id]) if filters[:project_id]
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

  def sanitize(text)
    # Add \\ to escape special characters. Four \ to escape the backslashes.
    # Escape anything that isn't in "a-zA-Z0-9 ._|'/"
    text.gsub(%r{([^a-zA-Z0-9 ._|'\/])}, '\\\\\1') if text
  end
end
