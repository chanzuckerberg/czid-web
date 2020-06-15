desc 'Creates a new AlignmentConfig for a set of indexes'

task create_alignment_config: :environment do
  name = ENV['NCBI_DATE'] # YYYY-MM-DD
  raise "Must have a $NCBI_DATE" unless name

  # lineage_version should be in sync with that used in lib/tasks/update_lineagedb.rake
  lineage_version = ENV['LINEAGE_VERSION']
  raise "Must have a $LINEAGE_VERSION. Try `TaxonLineage.maximum('version_start')`" unless lineage_version

  bucket = "s3://#{S3_DATABASE_BUCKET}"
  # SQLite was reverted because of a concurrency issue
  db_file_ext = 'db'

  config = AlignmentConfig.new(
    name: name,
    lineage_version: lineage_version.to_i,
    index_dir_suffix: name,

    s3_nt_db_path: "#{bucket}/ncbi-sources/#{name}/nt",
    s3_nt_loc_db_path: "#{bucket}/alignment_data/#{name}/nt_loc.#{db_file_ext}",
    s3_nr_db_path: "#{bucket}/ncbi-sources/#{name}/nr",
    s3_nr_loc_db_path: "#{bucket}/alignment_data/#{name}/nr_loc.#{db_file_ext}",
    s3_nt_info_db_path: "#{bucket}/alignment_data/#{name}/nt_info.db",
    s3_accession2taxid_path: "#{bucket}/alignment_data/#{name}/accession2taxid.#{db_file_ext}",

    s3_lineage_path: "#{bucket}/taxonomy/#{name}/taxid-lineages.#{db_file_ext}",
    s3_deuterostome_db_path: "#{bucket}/taxonomy/#{name}/deuterostome_taxids.txt",
    s3_taxon_blacklist_path: "#{bucket}/taxonomy/#{name}/taxon_blacklist.txt"
  )

  check_s3_paths!(config)

  config.save!

  puts "\n\n AlignmentConfig #{config} created."
end

def check_s3_paths!(config)
  s3 = Aws::S3::Resource.new(region: DEFAULT_S3_REGION)

  config.attributes.each do |attribute, value|
    if value && attribute.starts_with?('s3_') && attribute.ends_with?('_path')
      bucket_name = value.split('/')[2]
      bucket = s3.bucket(bucket_name)
      key = value.split('/')[3..-1].join('/')
      puts "\n\nChecking s3://#{bucket_name}/#{key} ...\n\n"
      raise "#{value} not found" unless bucket.object(key).exists?
    end
  end
end
