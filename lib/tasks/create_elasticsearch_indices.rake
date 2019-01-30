task create_elasticsearch_indices: :environment do
  models = [TaxonLineage, Sample, User, Metadatum]
  models.each do |m|
    m.__elasticsearch__.create_index!(force: true)
    m.__elasticsearch__.import
  end
end
