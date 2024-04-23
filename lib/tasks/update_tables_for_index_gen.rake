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

  index_name = prompt("Enter the index name used to run index generation (the folder inside ncbi-indexes-prod containing reference files): (ex: 2020-06-01): ")
  s3_dir = prompt("Enter the s3 path that stores the index files (ex: s3://<bucket>/<prefix>/index-generation-2): ")
  nt_db_name = prompt("Enter the name of the NT database (ex: nt, nt_compressed.fa, nt_compressed_shuffled.fa): ")
  nr_db_name = prompt("Enter the name of the NR database (ex: nr, nr_compressed.fa, nr_compressed_shuffled.fa): ")

  puts("Using S3 path #{s3_dir} for index generation files.")

  # create a temp folder so we can download and create files
  local_taxonomy_path = "/app/tmp/taxonomy"

  # es index params:
  alias_name = "taxon_lineages_alias"
  new_index_name = "taxon_lineages_#{index_name}"

  should_insert_alignment_config = prompt("MySQL: Do you want to insert an alignment config? (y/n): ") == "y"
  if should_insert_alignment_config
    insert_alignment_config(index_name, s3_dir, nt_db_name, nr_db_name)
  else
    puts("Skipping alignment config insert.")
  end

  load_new_table = prompt("MySQL: Do you want to load the new taxon lineages table? (y/n): ") == "y"
  if load_new_table
    load_new_table(host, database, s3_dir, local_taxonomy_path)
  else
    puts("Skipping loading the new taxon lineages table")
  end

  # create new ES index for taxon_lineages_new
  re_index_es = prompt("Elasticsearch: Do you want to create a new taxon lineages index? (y/n): ") == "y"
  if re_index_es
    begin
      puts("Creating a new index for taxon_lineages_new in Elasticsearch named #{new_index_name}.")
      # Updating elasticsearch took ~18 hours locally
      class TaxonLineageNew < TaxonLineage
        include Elasticsearch::Model
        self.table_name = 'taxon_lineages_new' # references recently populated table in MySQL
      end
      TaxonLineageNew.__elasticsearch__.create_index! index: new_index_name, force: true # force: true will delete the index if it already exists
      TaxonLineageNew.__elasticsearch__.import index: new_index_name
    rescue StandardError => e
      puts("Failed to create the new taxon lineages index in Elasticsearch: #{e.message}")
    end
  else
    puts("Skip creating taxon lineages table in Elasticsearch.")
  end

  # swap ES alias to new index
  swap_es_alias = prompt("Elastic Search: Do you want to swap the taxon lineages alias to the new index? (y/n): ") == "y"
  if swap_es_alias
    swap_es_alias(alias_name, new_index_name)
  else
    puts("Skipping swapping taxon lineages ES alias.")
  end

  # rename taxon_lineaeges tables:
  rename_taxon_lineages_tables = prompt("MySQL: Do you want to rename taxon_lineages_new to taxon_lineages? (y/n): ") == "y"
  if rename_taxon_lineages_tables
    rename_taxon_lineages_tables(local_taxonomy_path, database)
  else
    puts("Skip renaming taxon lineages tables.")
  end

  drop_old_table = prompt("MySQL: Do you want to drop the old taxon lineages table? (y/n): ") == "y"
  if drop_old_table
    drop_old_table(local_taxonomy_path, database)
  else
    puts("Skipping dropping old taxon lineages table.")
  end

  revert_es_index = prompt("Elastic Search: Do you want to revert the taxon lineages ES index to an old index? (y/n): ") == "y"
  if revert_es_index
    revert_es_index(alias_name)
  else
    puts("Skipping reverting taxon lineages ES index.")
  end

  drop_old_es_index = prompt("Elastic Search: Do you want to drop the old taxon lineages index? (y/n): ") == "y"
  if drop_old_es_index
    drop_old_es_index(old_index_name)
  else
    puts("Skipping dropping old taxon lineages ES index.")
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

def insert_alignment_config(index_name, s3_dir, nt_db_name, nr_db_name)
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
rescue StandardError => e
  puts("Failed to insert alignment config: #{e.message}")
end

def load_new_table(host, database, s3_dir, local_taxonomy_path)
  puts("Loading the new taxon lineages table.")
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
    echo "Loaded all lines into taxon_lineages_new."
  `
  unless $CHILD_STATUS.success?
    puts("Failed to load new taxon lineages table.")
  end
rescue StandardError => e
  puts("Failed to load new taxon lineages table: #{e.message}")
end

def swap_es_alias(alias_name, new_index_name)
  puts("Swapping taxon lineages ES alias to new index.")
  old_index_name = ElasticsearchQueryHelper.get_index_for_alias(alias_name)

  puts "swapping old_index_name: #{old_index_name} for new index: #{new_index_name}"
  ElasticsearchQueryHelper.swap_index_for_alias(old_index_name, new_index_name, alias_name)
rescue StandardError => e
  puts("Failed to swap taxon lineages ES alias to new index: #{e.message}")
end

def rename_taxon_lineages_tables(local_taxonomy_path, database)
  `
  cd #{local_taxonomy_path};
  echo "Loaded table into taxon_lineages_new. Renaming tables."
  mysql --defaults-extra-file=my.cnf -D #{database} -e "RENAME TABLE taxon_lineages TO taxon_lineages_old, taxon_lineages_new TO taxon_lineages"
  echo "Renamed tables successfully."
  `
rescue StandardError => e
  puts("Failed to rename taxon lineages tables: #{e.message}")
end

def drop_old_table(local_taxonomy_path, database)
  `
    cd #{local_taxonomy_path};
    mysql --defaults-extra-file=my.cnf -D #{database} -e "DROP TABLE taxon_lineages_old"
  `
rescue StandardError => e
  puts("Failed to drop old taxon lineages table: #{e.message}")
end

def revert_es_index(alias_name)
  puts("Reverting taxon lineages ES index to the old index.")
  current_index_name = ElasticsearchQueryHelper.get_index_for_alias(alias_name)
  revert_index = prompt("Enter the index name to revert back to: ")
  ElasticsearchQueryHelper.swap_index_for_alias(current_index_name, revert_index, alias_name)
rescue StandardError => e
  puts("Failed to revert taxon lineages ES index to the old index: #{e.message}")
end

def drop_old_es_index(old_index_name)
  puts("Dropping old taxon lineages ES index.")
  ElasticsearchQueryHelper.drop_index(old_index_name)
rescue StandardError => e
  puts("Failed to drop old taxon lineages ES index: #{e.message}")
end
