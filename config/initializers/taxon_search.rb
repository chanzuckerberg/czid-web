Rails.configuration.after_initialize do
  TAXON_SEARCH_LIST = JSON.dump(TaxonLineage.taxon_search_list("genus"))
end
