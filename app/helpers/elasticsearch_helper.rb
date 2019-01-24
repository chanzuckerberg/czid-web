module ElasticsearchHelper
  def prefix_match(model, field, prefix)
    search_params = { query: { query_string: { query: "#{prefix}*", fields: [field] } } }
    model.__elasticsearch__.search(search_params).records
  end

  def taxon_search(prefix)
    matching_taxa = {}
    %w[species genus].each do |level|
      search_params = { query: { query_string: { query: "#{prefix}*", fields: ["#{level}_name"] } } }
      TaxonLineage.__elasticsearch__.search(search_params).records.each do |record|
        # TODO: add constraint on version_end
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
