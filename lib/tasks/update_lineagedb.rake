require 'open3'
require 'csv'
require 'English'

desc 'Imports NCBI lineage data into IDseq'

task 'update_lineage_db', [:dryrun] => :environment do |_t, args|
  ### Short Usage: NCBI_DATE=2018-12-01 rake update_lineage_db
  ### Full Usage: REFERENCE_S3_FOLDER=s3://idseq-database/taxonomy/2018-12-01 LINEAGE_VERSION=3 rake update_lineage_db
  ### REFERENCE_S3_FOLDER needs to contain names.csv.gz and taxid-lineages.csv.gz
  ### LINEAGE_VERSION needs to be incremented by 1 from the current highest version in taxon_lineages

  # TODO: (gdingle): create "test mode" that uses sample lines from CSVs copied into this file
  puts "\n\nDRY RUN" if args.dryrun

  ncbi_date = ENV['NCBI_DATE']
  reference_s3_path = if ncbi_date.present?
                        "s3://idseq-database/taxonomy/#{ncbi_date}"
                      else
                        ENV['REFERENCE_S3_FOLDER'].gsub(%r{([/]*$)}, '') # trim any trailing '/'
                      end

  puts "\n\nStarting import of #{reference_s3_path} ...\n\n"
  importer = LineageDatabaseImporter.new(reference_s3_path, ncbi_date)
  importer.import! unless args.dryrun
  puts "\n\nDone import of #{reference_s3_path}."

  current_lineage_version = ENV['LINEAGE_VERSION'].to_i
  if current_lineage_version.zero?
    current_lineage_version = AlignmentConfig.maximum("lineage_version") + 1
  end

  puts "\n\nStarting update of lineage versions to #{current_lineage_version} ...\n\n"
  # TODO: (gdingle): reenable
  # add_lineage_version_numbers!(current_lineage_version, ncbi_date) unless args.dryrun
  puts "\n\nDone update of lineage versions to #{current_lineage_version}."

  ## Instructions on next steps
  puts "To complete this lineage update, you should now update PHAGE_FAMILIES_TAXIDS and PHAGE_TAXIDS in TaxonLineageHelper using the queries described therein."
end

class LineageDatabaseImporter
  def initialize(reference_s3_path, ncbi_date)
    @reference_s3_path = reference_s3_path
    @ncbi_date = ncbi_date
    @local_taxonomy_path = "/app/tmp/taxonomy/#{ncbi_date}"
  end

  def host
    Rails.env == 'development' ? 'db' : '$RDS_ADDRESS'
  end

  def lp
    Rails.env == 'development' ? '' : '--user=$DB_USERNAME --password=$DB_PASSWORD'
  end

  def import!
    setup
    import_new_names!
    import_new_taxid_lineages!
    # TODO: (gdingle): SQL import with ncbi_date
  end

  def import_new_names!(names_file = 'names.csv')
    table_name = "_new_names"
    names_cols = 'tax_id,name_txt,name_txt_common'
    shell_execute("
      #{aws_s3_cp(names_file, table_name)}
      #{mysql_execute(create_table_sql(table_name, names_cols.split(',')))}
      #{mysql_import(names_cols, table_name)}
    ")
  end

  # TODO: (gdingle): this is ugly
  # def column_names
  #   name_column_array = %w[superkingdom_name superkingdom_common_name kingdom_name kingdom_common_name phylum_name phylum_common_name class_name class_common_name
  #                          order_name order_common_name family_name family_common_name genus_name genus_common_name species_name species_common_name]
  # end

  def import_new_taxid_lineages!(taxid_lineages_file = 'taxid-lineages.csv')
    table_name = "_new_taxid_lineages"
    column_names = "taxid,superkingdom_taxid,kingdom_taxid,phylum_taxid,class_taxid,order_taxid,family_taxid,genus_taxid,species_taxid"
    shell_execute("
      #{aws_s3_cp(taxid_lineages_file, table_name)}
      #{mysql_execute(create_table_sql(table_name, column_names.split(',')))}
      #{mysql_import(column_names, table_name)}
    ")
  end

  private

  def check_shell_status!
    raise "lineage database update failed" unless $CHILD_STATUS.success?
  end

  def setup
    `
     set -xe
     ## Set work directory
     rm -rf #{@local_taxonomy_path};
     mkdir -p #{@local_taxonomy_path};
     cd #{@local_taxonomy_path};

     ## Check database connection
     mysql -h #{host} #{lp} -e "SELECT 1"
    `
    check_shell_status!
  end

  def aws_s3_cp(file_name, table_name)
    "aws s3 cp #{@reference_s3_path}/#{file_name}.gz - | gunzip | tail -n +2 > #{table_name}.csv"
  end

  def shell_execute(commands)
    puts `
    set -xe
    cd #{@local_taxonomy_path}
    #{commands}
    `
    check_shell_status!
  end

  def mysql_execute(sql)
    "mysql --verbose --host=#{host} #{lp} -D idseq_#{Rails.env} -e '#{sql}'"
  end

  def mysql_import(cols, table_name)
    # TODO: (gdingle): choose best and remove rest
    # mysql_execute("LOAD DATA LOCAL INFILE \"#{table_name}.csv\ INTO TABLE #{table_name}; SHOW WARNINGS;")
    "mysqlimport --verbose --local --host=#{host} #{lp} --columns=#{cols} --fields-terminated-by=',' idseq_#{Rails.env} #{table_name}.csv"
  end

  def create_table_sql(table_name, cols)
    col_defs = cols.map { |c| "#{c} text" }.join(', ')
    "drop table if exists #{table_name}; create table #{table_name}(#{col_defs})"
  end

  def new_taxon_lineages
    # taxid-lineages.csv has columns: tax_id,superkingdom,kingdom,phylum,class,order,family,genus,species
    # TODO: (gdingle): handle edge cases of negative ids
# TODO: (gdingle): more work on query
    "ALTER TABLE _new_names ADD UNIQUE _new_names_idx(tax_id(255));
SELECT * FROM _new_taxid_lineages l
 JOIN _new_names a ON l.superkingdom_taxid = a.tax_id
 JOIN _new_names b ON l.kingdom_taxid = b.tax_id
 JOIN _new_names c ON l.phylum_taxid = c.tax_id
 JOIN _new_names d ON l.class_taxid = d.tax_id
 JOIN _new_names e ON l.order_taxid = e.tax_id
 JOIN _new_names f ON l.family_taxid = f.tax_id
 JOIN _new_names g ON l.genus_taxid = g.tax_id
 JOIN _new_names h ON l.species_taxid = h.tax_id"
  end

  # TODO: (gdingle): find bette place
  # default_ended_at = TaxonLineage.column_defaults["ended_at"]

  def retire
    "SELECT old.* FROM old LEFT JOIN new WHERE new.id IS NULL AND old.ended_at = #{default_ended_at}"
  end

  def insert
    "SELECT new.* FROM new LEFT JOIN old WHERE old.id IS NULL AND old.ended_at = #{default_ended_at}"
  end

  def update
    "SELECT old.* FROM new INNER JOIN old WHERE old.ended_at = #{default_ended_at}"
  end

  def clean_up
    `
     set -xe
     ## Clean up
     # rm -rf #{@local_taxonomy_path};
    `
    check_shell_status!
  end
end

def add_lineage_version_numbers!(current_lineage_version, ncbi_date)
  # TODO: (gdingle): test me with ncbi_date instead of current_date
  TaxonLineage.where(started_at: ncbi_date).update_all(version_start: current_lineage_version) # rubocop:disable Rails/SkipsModelValidations
  TaxonLineage.where(ended_at: TaxonLineage.column_defaults["ended_at"]).update_all(version_end: current_lineage_version) # rubocop:disable Rails/SkipsModelValidations
end

######## DEPRECATED

def old_lineage_file
  n_columns = column_names.split(",").count
  `
   set -xe
   ## Get old lineage file
   mysql -h #{host} #{lp} -e "SELECT #{column_names},started_at FROM idseq_#{Rails.env}.taxon_lineages WHERE ended_at = (SELECT MAX(ended_at) FROM idseq_#{Rails.env}.taxon_lineages);" | tr "\t" "," | tail -n +2 > old_taxon_lineages_with_started_at.csv
   cut -d, -f1-#{n_columns} old_taxon_lineages_with_started_at.csv > old_taxon_lineages.csv
   cut -d, -f1,#{n_columns + 1} old_taxon_lineages_with_started_at.csv > taxid_to_started_at.csv
  `
  check_shell_status!
end

def new_lineage_file(reference_s3_path)
  taxid_lineages_file = 'taxid-lineages.csv'
  names_file = 'names.csv'
  `
   set -xe
   ## Get new lineage file
   # Download new references, extract and remove header line
   aws s3 cp #{reference_s3_path}/#{taxid_lineages_file}.gz - | gunzip | tail -n +2 > taxid-lineages.csv
   aws s3 cp #{reference_s3_path}/#{names_file}.gz - | gunzip | tail -n +2 > names.csv
    # names.csv has columns: tax_id,name_txt,name_txt_common
   # taxid-lineages.csv has columns: tax_id,superkingdom,kingdom,phylum,class,order,family,genus,species
  `
  check_shell_status!
end

def transform
  `
   set -xe
   # Now perform series of joins to produce the format in column_names.
   # TODO: (gdingle): this step is slow
   file1_ncol=9
   file1_output_cols=1.1,1.2,1.3,1.4,1.5,1.6,1.7,1.8,1.9
   sort -k1 -t, names.csv > names_sorted.csv
   for i in 2 3 4 5 6 7 8 9; do
     sort -k$i -t, taxid-lineages.csv > taxid-lineages_sorted.csv;
     join -t, -1 $i -2 1 -a 1 -o${file1_output_cols},2.2,2.3 taxid-lineages_sorted.csv names_sorted.csv > taxid-lineages.csv;
     file1_output_cols=${file1_output_cols},1.$((${file1_ncol}+1)),1.$((${file1_ncol}+2));
     file1_ncol=$((${file1_ncol}+2));
   done;

   ## Determine changes to make to taxon_lineages
   # Sort in view of using "comm" command
   sort old_taxon_lineages.csv > old_taxon_lineages_sorted.csv
   sort taxid-lineages.csv > new_taxon_lineages_sorted.csv

   # Find deleted lines and added lines
   comm -23 old_taxon_lineages_sorted.csv new_taxon_lineages_sorted.csv > records_to_retire.csv
   comm -13 old_taxon_lineages_sorted.csv new_taxon_lineages_sorted.csv > records_to_insert.csv

   # Add ended_at column for retired records, started_at column for new records
   sed -e 's/$/,#{current_date}/' -i records_to_retire.csv
   sed -e 's/$/,#{current_date}/' -i records_to_insert.csv

   # Add started_at column for retired records to make sure they violate [taxid, started_at] uniqueness and overwrite the correct record
   sort records_to_retire.csv > records_to_retire_sorted.csv
   sort taxid_to_started_at.csv > taxid_to_started_at_sorted.csv
   join -t, -1 1 -2 1 -a 1 -o${file1_output_cols},1.$((${file1_ncol}+1)),2.2 records_to_retire_sorted.csv taxid_to_started_at_sorted.csv > records_to_retire.csv

   ## Import changes to taxon_lineages
   # retired records:
   wc -l records_to_retire.csv
   mv records_to_retire.csv taxon_lineages
   mysqlimport --replace --local --host=#{host} #{lp} --columns=#{column_names},ended_at,started_at --fields-terminated-by=',' idseq_#{Rails.env} taxon_lineages;

   # new records:
   wc -l records_to_insert.csv
   mv records_to_insert.csv taxon_lineages
   mysqlimport --local --host=#{host} #{lp} --columns=#{column_names},started_at --fields-terminated-by=',' idseq_#{Rails.env} taxon_lineages
  `
  check_shell_status!
end

# TODO: (gdingle): wrap all in transaction and remove temp tables.
# TODO: (gdingle): include user prompt y/n, see https://stackoverflow.com/questions/226703/how-do-i-prompt-for-yes-no-cancel-input-in-a-linux-shell-script/27875395#27875395
#
# Add docs:
# It will go from alignment lineage_version to "lineage records with a [version_start, version_end] range that includes that number."
# Current version_end values basically:
# 0, ended 2018-04-18
# 1, ended 2018-07-23
# 2, current
# AlignmentConfig 2018-04-01 is our current one so it gets lineage_version = 2. AlignmentConfig 2018-02-15 gets lineage_version = 1.
# Every pipeline run has one of these AlignmentConfigs assigned already (no nil ones).
# Old records that have version_end == 0 will not be used / would have be succeeded by new records.
#
# We use the lineage_version to figure out which lineage records to use in our pipeline run. Lineage records are highly duplicated
# between versions, so instead of storing all of them, we store a [version_start, version_end] range with each lineage record.
# When the index is updated, if a lineage record is still valid, its version_end gets += 1. Otherwise it stays the same and has been replaced.

# HYPOTHESIS: THE NEW RECORDS CATEGORY IS BROKEN... NOT TAGGED WITH STARTED_AT



# TODO: (gdingle): check warnings
# + mysqlimport --verbose --local --host=db --columns=taxid,superkingdom_taxid,kingdom_taxid,phylum_taxid,class_taxid,order_taxid,family_taxid,genus_taxid,species_taxid --fields-terminated-by=, idseq_development _new_taxid_lineages.csv
# Loading data from LOCAL file: /app/tmp/taxonomy/2019-09-17/_new_taxid_lineages.csv into _new_taxid_lineages
# idseq_development._new_taxid_lineages: Records: 2140257  Deleted: 0  Skipped: 0  Warnings: 2140257

#