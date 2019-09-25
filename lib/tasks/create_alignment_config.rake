desc 'Creates a new AlignmentConfig for a set of indexes'

task 'create_alignment_config' do
  name = env['NCBI_DATE'] # YYYY-MM-DD
  raise "Must have a NCBI_DATE" unless name

  lineage_version = env['LINEAGE_VERSION'] || AlignmentConfig.last.lineage_version

  bucket = 's3://idseq-database'
  # SQLite was reverted because of a concurrency issue
  db_file_ext = 'db'

  config = AlignmentConfig.new(
    name: name,
    lineage_version: lineage_version,
    index_dir_suffix: name,

    s3_nt_db_path: "#{bucket}/alignment_data/#{name}/nt",
    s3_nt_loc_db_path: "#{bucket}/alignment_data/#{name}/nt_loc.#{db_file_ext}",
    s3_nr_db_path: "#{bucket}/alignment_data/#{name}/nr",
    s3_nr_loc_db_path: "#{bucket}/alignment_data/#{name}/nr_loc.#{db_file_ext}",
    s3_accession2taxid_path: "#{bucket}/alignment_data/#{name}/accession2taxid.#{db_file_ext}",

    s3_lineage_path: "#{bucket}/taxonomy/#{name}/taxid-lineages.#{db_file_ext}",
    s3_deuterostome_db_path: "#{bucket}/taxonomy/#{name}/deuterostome_taxids.txt"
  )

  check_s3_paths!

  config.save!
end

def check_s3_paths!(config)
  s3 = Aws::S3::Client.new(region: DEFAULT_S3_REGION)
  config.attributes.each do |attribute, value|
    if attribute.startswith('s3_') || attribute.endswith('_path')
      bucket = value.split('/')[2]
      key = value.split('/')[3..-1].join('/')
      puts "\nChecking #{bucket}/#{key} ..."
      _ = s3.get_object(bucket: bucket, key: key)
    end
  end
end
