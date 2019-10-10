require 'open3'
require 'csv'
require 'English'

desc 'Imports NCBI lineage data into IDseq'

task 'update_lineage_db', [:run_mode] => :environment do |_t, args|
  ### Short Usage: NCBI_DATE=2018-12-01 rake update_lineage_db
  ### Full Usage: REFERENCE_S3_FOLDER=s3://idseq-database/taxonomy/2018-12-01 LINEAGE_VERSION=3 rake update_lineage_db
  ### REFERENCE_S3_FOLDER needs to contain names.csv.gz and taxid-lineages.csv.gz
  ### LINEAGE_VERSION needs to be incremented by 1 from the current highest version in taxon_lineages

  dryrun = args.run_mode == "dryrun" ? true : false
  testrun = args.run_mode == "testrun" ? true : false

  puts "\n\nDRY RUN" if dryrun
  puts "\n\nTEST RUN" if testrun

  ncbi_date = ENV['NCBI_DATE']
  reference_s3_path = if ncbi_date.present?
                        "s3://idseq-database/taxonomy/#{ncbi_date}"
                      else
                        ENV['REFERENCE_S3_FOLDER'].gsub(%r{([/]*$)}, '') # trim any trailing '/'
                      end

  puts "\n\nStarting import of #{reference_s3_path} ...\n\n"
  importer = LineageDatabaseImporter.new(reference_s3_path, ncbi_date)
  importer.import!(testrun) unless dryrun
  puts "\n\nDone import of #{reference_s3_path}."

  current_lineage_version = ENV['LINEAGE_VERSION'].to_i
  if current_lineage_version.zero?
    current_lineage_version = AlignmentConfig.maximum("lineage_version") + 1
  end

  puts "\n\nStarting update of lineage versions to #{current_lineage_version} ...\n\n"
  # TODO: (gdingle): reenable
  # add_lineage_version_numbers!(current_lineage_version, ncbi_date) unless dryrun
  puts "\n\nDone update of lineage versions to #{current_lineage_version}."

  ## Instructions on next steps
  puts "To complete this lineage update, you should now update PHAGE_FAMILIES_TAXIDS and PHAGE_TAXIDS in TaxonLineageHelper using the queries described therein."
end

class LineageDatabaseImporter
  def initialize(reference_s3_path, ncbi_date)
    @reference_s3_path = reference_s3_path
    @ncbi_date = ncbi_date
    @local_taxonomy_path = "/app/tmp/taxonomy/#{ncbi_date}"
    @names_table = "_new_names"
    @taxid_table = "_new_taxid_lineages"
    @taxon_lineages_table = "_new_taxon_lineages"
  end

  def host
    Rails.env == 'development' ? 'db' : '$RDS_ADDRESS'
  end

  def lp
    Rails.env == 'development' ? '' : '--user=$DB_USERNAME --password=$DB_PASSWORD'
  end

  def import!(test_run = false)
    setup

    if test_run
      shell_execute("
        echo '#{example_names_csv}' > #{@names_table}.csv
        echo '#{example_taxid_lineages_csv}' > #{@taxid_table}.csv
      ")
    else
      shell_execute(
        aws_s3_cp('names.csv', @names_table),
        aws_s3_cp('taxid-lineages.csv', @taxid_table)
      )
    end

    import_new_names!
    import_new_taxid_lineages!
    build_new_taxon_lineages!



    # TODO: (gdingle): set these later
    # "started_at",
    # "ended_at",
    # TODO: (gdingle): what's the story for tax_name? it is always null
    # "tax_name",

    # TODO: (gdingle): set these later
    # "version_start",
    # "version_end",

    # TODO: (gdingle): SQL import with ncbi_date
    # TODO: (gdingle): Row 5 doesn't contain data for all columns... do we need to validate all this?
  end

  def import_new_names!
    # modified from original file "tax_id,name_txt,name_txt_common" for convenience
    names_cols = 'taxid,name,common_name'
    shell_execute(
      mysql_query(create_table_sql(@names_table, names_cols.split(','))),
      mysql_import(names_cols, @names_table),
      mysql_query("ALTER TABLE #{@names_table} ADD UNIQUE _new_names_idx(taxid(255))")
    )
  end

  # TODO: (gdingle): this is ugly
  # def column_names
  #   name_column_array = %w[superkingdom_name superkingdom_common_name kingdom_name kingdom_common_name phylum_name phylum_common_name class_name class_common_name
  #                          order_name order_common_name family_name family_common_name genus_name genus_common_name species_name species_common_name]
  # end

  def import_new_taxid_lineages!
    column_names = "taxid,superkingdom_taxid,kingdom_taxid,phylum_taxid,class_taxid,order_taxid,family_taxid,genus_taxid,species_taxid"
    shell_execute(
      mysql_query(create_table_sql(@taxid_table, column_names.split(','))),
      mysql_import(column_names, @taxid_table)
    )
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
    #{commands.respond_to?('join') ? commands.join("\n") : commands}
    `
    check_shell_status!
  end

  def mysql_query(sql)
    "mysql --verbose --host=#{host} #{lp} -D idseq_#{Rails.env} -e '#{sql}'"
  end

  def mysql_import(cols, table_name)
    # TODO: (gdingle): choose best and remove rest
    # mysql_query("LOAD DATA LOCAL INFILE \"#{table_name}.csv\ INTO TABLE #{table_name}; SHOW WARNINGS;")
    "mysqlimport --verbose --local --host=#{host} #{lp} --columns=#{cols} --fields-terminated-by=',' idseq_#{Rails.env} #{table_name}.csv"
  end

  def create_table_sql(table_name, cols)
    col_defs = cols.map { |c| "#{c} text" }.join(', ')
    "drop table if exists #{table_name}; create table #{table_name}(#{col_defs})"
  end

  def build_new_taxon_lineages!
    # TODO: (gdingle): handle edge cases of negative ids
    cols = [
      "taxid",

      "superkingdom_taxid",
      "phylum_taxid",
      "class_taxid",
      "order_taxid",
      "family_taxid",
      "genus_taxid",
      "species_taxid",

      "superkingdom_name",
      "phylum_name",
      "class_name",
      "order_name",
      "family_name",
      "genus_name",
      "species_name",

      "superkingdom_common_name",
      "phylum_common_name",
      "class_common_name",
      "order_common_name",
      "family_common_name",
      "genus_common_name",
      "species_common_name",

      # These appear to have been added later
      "kingdom_taxid",
      "kingdom_name",
      "kingdom_common_name",
    ]

    shell_execute(
      mysql_query(create_table_sql(@taxon_lineages_table, cols)),
      mysql_query("ALTER TABLE #{@names_table} ADD UNIQUE _new_names_idx(taxid(255))")
    )

    col_expressions = cols.map do |col|
      if col == "taxid"
        "l.taxid"
      else
        table, name_col = col.split('_', 2)
        # need to escape because of "order"
        "`#{table}`.#{name_col}"
      end
    end

    shell_execute(mysql_query(
      "INSERT INTO #{@taxon_lineages_table}
      SELECT #{col_expressions.join(', ')} FROM #{@taxid_table} l
      JOIN #{@names_table} superkingdom ON l.superkingdom_taxid = superkingdom.taxid
      JOIN #{@names_table} kingdom ON l.kingdom_taxid = kingdom.taxid
      JOIN #{@names_table} phylum ON l.phylum_taxid = phylum.taxid
      JOIN #{@names_table} class ON l.class_taxid = class.taxid
      JOIN #{@names_table} `order` ON l.order_taxid = `order`.taxid
      JOIN #{@names_table} family ON l.family_taxid = family.taxid
      JOIN #{@names_table} genus ON l.genus_taxid = genus.taxid
      JOIN #{@names_table} species ON l.species_taxid = species.taxid"
    ))
    # TODO: (gdingle): verify that all
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

# Determined by all tax_ids in random sample below
def example_names_csv
  "2759,Eukaryota,eucaryotes
3214,Bryopsida,
4751,Fungi,fungi
4890,Ascomycota,ascomycetes
5125,Hypocreales,
6231,Nematoda,roundworms
6236,Rhabditida,
6656,Arthropoda,arthropods
6854,Arachnida,arachnids
6893,Araneae,spiders
7041,Coleoptera,beetles
7065,Tenebrionidae,darkling ground
7066,Tenebrio,
7088,Lepidoptera,butterflies and moths
7147,Diptera,flies
7149,Chironomidae,nonbiting midges
7366,Muscidae,house flies
7399,Hymenoptera,
13390,Camponotus,carpenter ants
13798,Hypnales,
33090,Viridiplantae,
33208,Metazoa,metazoans
35493,Streptophyta,
36668,Formicidae,
41094,Dermestidae,skin and larder
50557,Insecta,true insects
70160,Anguillicolidae,
70161,Anguillicola,
82593,Geometridae,geometer moths
103887,Bionectriaceae,
119089,Chromadorea,
142998,Pseudotrismegistia,
147550,Sordariomycetes,
153373,Cricotopus,
214137,Eupithecia,
224610,Promyrmekiaphila,
241409,Geosmithia,
305609,Coenosia,
324114,Pseudotrismegistia,
404319,Pylaisiadelphaceae,
441264,Caenocara,
441265,Caenocara,tsuchiguri MSL2007
461026,Promyrmekiaphila,FTRb2
620899,Anguillicola,
1283840,Euctenizidae,
1333032,Eupithecia,BOLD:AAP1678
1588501,Tenebrio,
1720211,Camponotus,1 CT-2015
2213681,Coenosia,BIOUG19916-C11
2401214,Cricotopus,BIOUG30446-A09
2518203,Geosmithia,22 YTH-2019"
end

# Determined by random sample of full set
def example_taxid_lineages_csv
  "1588501,2759,33208,6656,50557,7041,7065,7066,1588501
2213681,2759,33208,6656,50557,7147,7366,305609,2213681
2518203,2759,4751,4890,147550,5125,103887,241409,2518203
620899,2759,33208,6231,119089,6236,70160,70161,620899
1720211,2759,33208,6656,50557,7399,36668,13390,1720211
2401214,2759,33208,6656,50557,7147,7149,153373,2401214
461026,2759,33208,6656,6854,6893,1283840,224610,461026
1333032,2759,33208,6656,50557,7088,82593,214137,1333032
142998,2759,33090,35493,3214,13798,404319,324114,142998
441265,2759,33208,6656,50557,7041,41094,441264,441265"
end

