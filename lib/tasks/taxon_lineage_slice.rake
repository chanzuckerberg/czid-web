namespace :taxon_lineage_slice do
  CURRENT_VERSION = "2024-02-06".freeze
  SLICE_NAME = "taxon_lineages_2024_slice.csv".freeze
  S3_BUCKET_NAME = ENV['S3_DATABASE_BUCKET']
  INDEXES_PREFIX = "ncbi-indexes-prod/#{CURRENT_VERSION}/index-generation-2".freeze
  TAXON_LINEAGE_FILE_KEY = "#{INDEXES_PREFIX}/#{SLICE_NAME}".freeze

  desc "Seed 2024 taxon lineage data"
  task import_data_from_s3: :environment do
    puts "Inserting #{CURRENT_VERSION} taxon lineage slice, this could take a while"

    if TaxonLineage.exists?(version_start: CURRENT_VERSION)
      abort("Taxon Lineage data for #{CURRENT_VERSION} already exists")
    end

    s3 = Aws::S3::Client.new(unsigned_operations: [:get_object])
    response = s3.get_object(bucket: S3_BUCKET_NAME, key: TAXON_LINEAGE_FILE_KEY)
    print "Importing Taxon Lineage data from S3"

    chunk_size = 10_000
    rows = []
    counter = 0

    csv_data = response.body.read  # Read the data once
    total_rows = CSV.parse(csv_data, headers: true).count # Count rows for progress tracking

    # Process the CSV in chunks to avoid memory issues
    CSV.parse(csv_data, headers: true) do |row|
      rows << row.to_h.transform_values(&:to_s)
      if rows.size >= chunk_size
        # Inserting in bulk for performance reasons
        # rubocop:disable Rails/SkipsModelValidations
        TaxonLineage.insert_all(rows)
        # rubocop:enable Rails/SkipsModelValidations
        rows.clear # Clear the array to free up memory and prepare for the next chunk
        counter += chunk_size
        puts "#{(counter.to_f / total_rows) * 100}% of rows imported"
      end
    end

    # Insert any remaining rows that didn't fill up the last chunk
    unless rows.empty?
      # rubocop:disable Rails/SkipsModelValidations
      TaxonLineage.insert_all(rows) unless rows.empty?
      # rubocop:enable Rails/SkipsModelValidations
      counter += rows.size
      puts "#{(counter.to_f / total_rows) * 100}% of rows imported"
    end
  end

  task remove_slice: :environment do
    puts "Removing #{CURRENT_VERSION} taxon lineage slice"
    TaxonLineage.where(version_end: CURRENT_VERSION).destroy_all
  end

  task create_taxon_lineage_slice_es_index: :environment do
    puts "Creating Elasticsearch index for #{CURRENT_VERSION} slice of taxon lineage data"
    TaxonLineage.__elasticsearch__.create_index!(force: true)
    TaxonLineage.__elasticsearch__.import
    puts "Finished indexing TaxonLineage."
  end
end
