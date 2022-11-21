task create_elasticsearch_indices: :environment do
  # Silence debug logging
  silent = Logger.new(nil)
  Rails.logger = silent
  ActiveRecord::Base.logger = silent
  ActiveRecord::Base.logger.level = 2

  if ELASTICSEARCH_ON
    # Index small tables
    models = [User, Project, Sample, Metadatum]
    models.each do |m|
      puts "Indexing #{m}..."
      [1, 2].each do |_|
        # Do it twice in case it doesn't yet exist the first time
        m.__elasticsearch__.create_index!(force: true)
      end
      m.__elasticsearch__.import
      puts "Finished indexing #{m}"
    end
  end

  # Index TaxonLineage. This takes longer and does not need to be completed in its entirety for local development.
  puts "Final step: indexing TaxonLineage. For local development, it is safe to interrupt this step in the interest of time."
  TaxonLineage.__elasticsearch__.create_index!(force: true)
  TaxonLineage.__elasticsearch__.import
  puts "Finished indexing TaxonLineage."
end
