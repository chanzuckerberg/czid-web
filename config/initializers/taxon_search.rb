Rails.configuration.after_initialize do
  max_ended_at = TaxonLineage.column_defaults["ended_at"] # infinitely far in the future
  lineages = TaxonLineage.where("genus_taxid > 0").where.not(genus_name: "").where("ended_at = ?", max_ended_at)
  lineages = lineages.select(:genus_taxid, :genus_name).distinct.order(:genus_name).index_by(&:genus_name) # index_by makes sure it's unique on genus_name alone
  taxon_search = lineages.map do |genus_name, record|
    { "title" => genus_name,
      "description" => "Taxonomy ID: #{record.genus_taxid}",
      "taxid" => record.genus_taxid }
  end
  TAXON_SEARCH_LIST = JSON.dump(taxon_search)
end
