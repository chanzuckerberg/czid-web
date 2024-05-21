require 'aws-sdk-s3'
require 'csv'

class AddTaxonLineage2024 < SeedMigration::Migration
  S3_BUCKET_NAME = ENV['S3_DATABASE_BUCKET']
  INDEXES_PREFIX = "ncbi-indexes-prod/2024-02-06/index-generation-2"
  TAXON_LINEAGE_FILE_KEY = "#{INDEXES_PREFIX}/taxon_lineages_2024_slice.csv"

  def up
    create_alignment_config unless AlignmentConfig.exists?(name: "2024-02-06")
    create_app_config unless AppConfig.exists?(key: "default_alignment_config_name")
    create_taxon_lineage unless TaxonLineage.exists?(version_start: "2024-02-06")
  end

  def down
    AlignmentConfig.find_by(name: "2024-02-06")&.destroy!
    AppConfig.find_by(key: "default_alignment_config_name")&.destroy!
    remove_lineage_data_from_s3(S3_BUCKET_NAME, TAXON_LINEAGE_FILE_KEY)
  end

  private

  def create_alignment_config
    print "Creating 2024-02-06 Taxon Lineage"
    AlignmentConfig.create!(
      name: "2024-02-06",
      index_dir_suffix: nil,
      lineage_version: "2024-02-06",
      **s3_paths
    )
  end

  def create_app_config
    print "Creating default_alignment_config_name"
    AppConfig.create!(key: "default_alignment_config_name", value: "2024-02-06")
  end

  def create_taxon_lineage
    print "Creating Taxon Lineage"
    import_lineage_data_from_s3(S3_BUCKET_NAME, TAXON_LINEAGE_FILE_KEY)
  end

  def s3_paths
    {
      s3_nt_db_path: s3_path("nt_compressed_shuffled.fa"),
      s3_nt_loc_db_path: s3_path("nt_loc.marisa"),
      s3_nr_db_path: s3_path("nr_compressed_shuffled.fa"),
      s3_nr_loc_db_path: s3_path("nr_loc.marisa"),
      s3_lineage_path: s3_path("taxid-lineages.marisa"),
      s3_accession2taxid_path: s3_path("accession2taxid.marisa"),
      s3_deuterostome_db_path: s3_path("deuterostome_taxids.txt"),
      s3_nt_info_db_path: s3_path("nt_info.marisa"),
      s3_taxon_blacklist_path: s3_path("taxon_ignore_list.txt"),
      minimap2_long_db_path: s3_path("nt_k14_w8_20/"),
      minimap2_short_db_path: s3_path("nt_k14_w8_20/"),
      diamond_db_path: s3_path("diamond_index_chunksize_5500000000/")
    }
  end

  def s3_path(file)
    "s3://#{S3_BUCKET_NAME}/#{INDEXES_PREFIX}/#{file}"
  end

  def import_lineage_data_from_s3(bucket_name, file_key)
    s3 = Aws::S3::Client.new
    response = s3.get_object(bucket: bucket_name, key: file_key)
    print "Importing Taxon Lineage data from S3"

    chunk_size = 1000
    rows = []

    # Process the CSV in chunks to avoid memory issues
    CSV.parse(response.body.read, headers: true) do |row|
      rows << row.to_h.transform_values(&:to_s)
      if rows.size >= chunk_size
        TaxonLineage.insert_all(rows)
        rows.clear  # Clear the array to free up memory and prepare for the next chunk
      end
    end

    # Insert any remaining rows that didn't fill up the last chunk
    TaxonLineage.insert_all(rows) unless rows.empty?
  end

  def remove_lineage_data_from_s3(bucket_name, file_key)
    s3 = Aws::S3::Client.new
    response = s3.get_object(bucket: bucket_name, key: file_key)
    print "Removing Taxon Lineage data from S3"

    chunk_size = 1000
    taxids = []

    CSV.parse(response.body.read, headers: true) do |row|
      stringified_row = row.to_h.transform_values(&:to_s)
      taxids << stringified_row["taxid"]

      # Process deletion in chunks
      if taxids.size >= chunk_size
        TaxonLineage.where(taxid: taxids).delete_all
        taxids.clear  # Clear the array to free up memory and prepare for the next chunk
      end
    end

    # Handle any remaining taxids that didn't fill up the last chunk
    TaxonLineage.where(taxid: taxids).delete_all unless taxids.empty?
  end
end

