module ElasticsearchHelper
  def prefix_match(model, field, prefix, condition)
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

  def taxon_search(prefix)
    return {} if Rails.env == "test"
    matching_taxa = {}
    %w[species genus].each do |level|
      search_params = { query: { query_string: { query: "#{prefix}*", fields: ["#{level}_name"] } } }
      TaxonLineage.__elasticsearch__.search(search_params).records.each do |record|
        name = record["#{level}_name"]
        taxid = record["#{level}_taxid"]
        matching_taxa[name] = {
          "title" => name,
          "description" => "Taxonomy ID: #{taxid}",
          "taxid" => taxid
        }
      end
    end
    matching_taxa.values
  end
end
