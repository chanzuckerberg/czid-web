require 'open3'
require 'csv'
require 'English'

# TODO(nina) do not run until creating the new taxon lineages ES index has been safely
# implemented for zero downtime.

# Manage DB updates required to deploy new NCBI indexes
# Allows inserting alignment config, updating and/or dropping taxon lineages table
# Updating the taxon lineages table took about 1-2 hours locally for 3 million records

task update_tables_for_index_gen: :environment do |_, _args|
  Rails.logger.level = Logger::DEBUG
  def prompt(*args)
    print(*args)
    STDIN.gets.chomp
  end

  host = Rails.env.development? ? 'db' : '$RDS_ADDRESS'
  database = "idseq_#{Rails.env}"

  index_name = prompt("Enter the index name (ex: 2020-06-01): ")
  s3_dir = prompt("Enter the s3 path that stores the index files (ex: s3://<bucket>/<prefix>/index-generation-2): ")
  nt_db_name = prompt("Enter the name of the NT database (ex: nt, nt_compressed.fa, nt_compressed_shuffled.fa): ")
  nr_db_name = prompt("Enter the name of the NR database (ex: nr, nr_compressed.fa, nr_compressed_shuffled.fa): ")

  puts("Using S3 path #{s3_dir} for index generation files.")
  should_insert_alignment_config = prompt("Do you want to insert an alignment config to MySQL? (y/n): ") == "y"

  # create a temp folder so we can download and create files
  local_taxonomy_path = "/app/tmp/taxonomy"

  if should_insert_alignment_config

    config = AlignmentConfig.new(
      name: index_name,
      lineage_version: index_name,
      s3_nt_db_path: "#{s3_dir}/#{nt_db_name}",
      s3_nt_loc_db_path: "#{s3_dir}/nt_loc.marisa",
      s3_nr_db_path: "#{s3_dir}/#{nr_db_name}",
      s3_nr_loc_db_path: "#{s3_dir}/nr_loc.marisa",
      s3_lineage_path: "#{s3_dir}/taxid-lineages.marisa",
      s3_accession2taxid_path: "#{s3_dir}/accession2taxid.marisa",
      s3_deuterostome_db_path: "#{s3_dir}/deuterostome_taxids.txt",
      s3_nt_info_db_path: "#{s3_dir}/nt_info.marisa",
      s3_taxon_blacklist_path: "#{s3_dir}/taxon_ignore_list.txt"
    )
    check_s3_paths!(config)

    config.save!

    puts "\n\n AlignmentConfig #{config} created."
  else
    puts("Skipping alignment config insert.")
  end

  load_new_table = prompt("Do you want to load the new taxon lineages table? (y/n): ") == "y"

  if load_new_table
    taxid_lineages_file = 'versioned-taxid-lineages.csv'
    `
      mkdir -p #{local_taxonomy_path};
      cd #{local_taxonomy_path};

      {
        echo "[client]"
        echo "protocol=tcp"
        echo "host=#{host}"
        echo "user=$DB_USERNAME"
        echo "password=$DB_PASSWORD"
      } > my.cnf

      set -ex

      echo "Downloading taxon lineages file from #{s3_dir}/#{taxid_lineages_file}.gz"
      aws s3 cp #{s3_dir}/#{taxid_lineages_file}.gz .

      gzip -dc #{taxid_lineages_file}.gz > taxon_lineages_new.csv
      echo "Downloaded taxon lineages file. Loading into MySQL."

      COLS=$(head -n 1 taxon_lineages_new.csv)
      mysql --defaults-extra-file=my.cnf -D #{database} -e "CREATE TABLE taxon_lineages_new LIKE taxon_lineages"

      mysqlimport --defaults-extra-file=my.cnf --verbose --local --columns="$COLS" --fields-terminated-by=',' --fields-optionally-enclosed-by='"' --ignore-lines 1 #{database} taxon_lineages_new.csv

      NUM_ROWS_LOADED=$(mysql --defaults-extra-file=my.cnf -D #{database} -e "SELECT COUNT(*) from taxon_lineages_new" | tail -n 1)

      echo $NUM_ROWS_LOADED

      if [ $((NUM_ROWS_LOADED + 1)) -ne $(wc -l < taxon_lineages_new.csv) ]; then
        echo "Failed to load all lines into taxon_lineages_new. Dropping taxon_lineages_new"
        mysql --defaults-extra-file=my.cnf -D #{database} -e "DROP TABLE taxon_lineages_new"
        exit 1
      fi

      echo "Loaded table into taxon_lineages_new. Renaming tables."
      mysql --defaults-extra-file=my.cnf -D #{database} -e "RENAME TABLE taxon_lineages TO taxon_lineages_old, taxon_lineages_new TO taxon_lineages"
      echo "Renamed tables successfully."
    `
    unless $CHILD_STATUS.success?
      puts("Failed to load new taxon lineages table.")
    end
  else
    puts("Skipping loading in new taxon lineages table.")
  end

  # TODO(nina): Re-indexing the taxon lineages table in Elasticsearch should be required but is not
  # yet implemented with zero downtime. Commenting this out to avoid downtime while testing new
  # lineage table on staging.
  re_index_es = prompt("Do you want to re-index the taxon lineages table in Elasticsearch? (y/n): ") == "y"
  if re_index_es
    puts("Re-indexing the taxon lineages table in Elasticsearch.")
    # Updating elasticsearch took ~18 hours locally
    Resque.enqueue(ReindexTaxonLineagesTableEs)
  else
    puts("Skipping re-indexing taxon lineages table in Elasticsearch.")
  end

  drop_old_table = prompt("Do you want to drop the old taxon lineages table? (y/n): ") == "y"
  if drop_old_table
    `
      cd #{local_taxonomy_path};
      mysql --defaults-extra-file=my.cnf -D #{database} -e "DROP TABLE taxon_lineages_old"
    `
  else
    puts("Skipping dropping old taxon lineages table.")
  end

  `rm -rf #{local_taxonomy_path};`
end

def check_s3_paths!(config)
  s3 = Aws::S3::Resource.new(client: Aws::S3::Client.new)

  config.attributes.each do |_, value|
    if value && value.is_a?(String)
      bucket_name, key = S3Util.parse_s3_path(value)
      if bucket_name && key
        bucket = s3.bucket(bucket_name)
        puts "\n\nChecking s3://#{bucket_name}/#{key} ...\n\n"
        raise "#{value} not found" unless bucket.object(key).exists?
      end
    end
  end
end
