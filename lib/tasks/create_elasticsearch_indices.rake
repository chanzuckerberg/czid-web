task create_elasticsearch_indices: :environment do
  models = [User, Project, Sample, Metadatum, TaxonLineage]
  models.each do |m|
    puts "Indexing #{m}..."
    puts "This will take a while..." if m == TaxonLineage
    m.__elasticsearch__.create_index!(force: true)
    m.__elasticsearch__.import
    puts "Finished indexing #{m}"
  end
end
