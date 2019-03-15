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

  def taxon_search(prefix, tax_levels = TaxonCount::NAME_2_LEVEL.keys, project_id = nil)
    return {} if Rails.env == "test"
    prefix = sanitize(prefix)
    matching_taxa = {}

    tax_levels.each do |level|
      search_params = { query: { query_string: { query: "#{prefix}*", fields: ["#{level}_name"] } } }
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

    if project_id.present?
      filter_by_project(matching_taxa.values, project_id)
    else
      matching_taxa.values
    end
  end

  private

  # Took 250ms in local testing on real data
  def filter_by_project(matching_taxa, project_id)
    # TODO: (gdingle): do we want both species and genus? only genus appears to be returned by TaxonCount
    project_tax_ids = Set.new(TaxonCount
      .joins(pipeline_run: { sample: :project })
      .where(samples: { project_id: project_id })
      .where(tax_id: [matching_taxa.map { |taxa| taxa["taxid"] }])
      .where("tax_id > 0") # negative numbers mean unknown... see TaxonLineage
      .where(count_type: ["NT", "NR"])
      .where("count > #{ReportHelper::MINIMUM_READ_THRESHOLD}")
      .distinct()
      .pluck(:tax_id))

    matching_taxa.select { |taxa| project_tax_ids.include?(taxa["taxid"]) }
  end

  def sanitize(prefix)
    # Add \\ to escape special characters. Four \ to escape the backslashes.
    # Escape anything that isn't in "a-zA-Z0-9 ._|'/"
    prefix.gsub(%r{([^a-zA-Z0-9 ._|'\/])}, '\\\\\1') if prefix
  end
end
