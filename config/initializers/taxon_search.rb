Rails.configuration.after_initialize do
  if ActiveRecord::Base.connection.table_exists?(:taxon_lineages)
    TAXON_SEARCH_LIST = JSON.dump(TaxonLineage.taxon_search_list("genus"))
  end
end
