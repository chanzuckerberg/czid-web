module ElasticsearchHelper
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

  def taxon_search(prefix, tax_levels = TaxonCount::NAME_2_LEVEL.keys)
    return {} if Rails.env == "test"
    prefix = sanitize(prefix)
    matching_taxa = {}

    tax_levels.each do |level|
      # TODO: (gdingle): pass in project filter here
      search_params = { query: { query_string: { query: "#{prefix}*", fields: ["#{level}_name"] } } }
      # TODO: (gdingle): query taxon counts and see how expensive?
      TaxonLineage.__elasticsearch__.search(search_params).records.each do |record|
        name = record["#{level}_name"]
        taxid = record["#{level}_taxid"]
        matching_taxa[name] = {
          "title" => name,
          "description" => "Taxonomy ID: #{taxid}",
          "taxid" => taxid,
          "level" => level
        }
      end
    end
    filter_by_project(matching_taxa.values)
  end

  private

  def filter_by_project(matching_taxa, project_id)
    # taxon_counts.pipeline_run_id -> pipeline_runs->sample_id -> samples.project_id
    project_id = 70 # medical detectives
    tax_ids = TaxonCount
              .joins(:pipeline_run)
              .joins(:sample)
              .joins(:project)
              .where(project: project_id)
              .pluck(:taxid)
    tax_ids = Set[tax_ids]
    matching_taxa.filter { |_taxa| tax_ids.includes?(taxid) }
  end

  def sanitize(prefix)
    # Add \\ to escape special characters. Four \ to escape the backslashes.
    # Escape anything that isn't in "a-zA-Z0-9 ._|'/"
    prefix.gsub(%r{([^a-zA-Z0-9 ._|'\/])}, '\\\\\1') if prefix
  end
end
