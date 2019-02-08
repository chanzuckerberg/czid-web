task create_elasticsearch_indices: :environment do
  models = [User, Project, Sample, Metadatum]
  models.each do |m|
    puts "Indexing #{m}..."
    puts "This will take a while..." if m == TaxonLineage
    m.__elasticsearch__.create_index!(force: true)
    m.__elasticsearch__.import
    puts "Finished indexing #{m}"
  end
  # Do the same for TaxonLineage. This takes longer and does not need to be completed in its entirety for local development.
  puts "Final step: indexing TaxonLineage. For local development, it is safe to interrupt this step in the interest of time."
  TaxonLineage.__elasticsearch__.create_index!(force: true)
  TaxonLineage.__elasticsearch__.import
  puts "Finished indexing TaxonLineage."
end
