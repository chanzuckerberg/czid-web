require 'open3'
require 'csv'
require 'English'

desc 'Imports NCBI lineage data into IDseq'

# Lineage records have a [version_start, version_end] inclusive range. Each
# pipline run has an AlignmentConfig that has a lineage_version. The pipeline
# should only count lineages where:
#
#  lineage_version BETWEEN
#   taxon_lineages.version_start
#   AND taxon_lineages.version_end
#
# See PipelineRun#generate_aggregate_counts.
#
# When our NCBI indexes are updated, we should run this script.
# If a current lineage record is still valid, its version_end gets += 1.
# If a current lineage record is absent, its version_end stays the same.
# If a current lineage record is different, it is updated.
# If a new lineage record appears, it is inserted.
task 'update_lineage_db', [:run_mode] => :environment do |_t, args|
  ### Short Usage: NCBI_DATE=2018-12-01 rake update_lineage_db
  ### Full Usage: REFERENCE_S3_FOLDER=s3://idseq-database/taxonomy/2018-12-01 rake update_lineage_db
  ### REFERENCE_S3_FOLDER needs to contain names.csv.gz and taxid-lineages.csv.gz

  Logging.logger.root.level = :info

  testrun = args.run_mode == "testrun" ? true : false
  puts "\n\nTEST RUN - LOCAL DATA" if testrun

  ncbi_date = ENV['NCBI_DATE']
  reference_s3_path = if ncbi_date.present?
                        "s3://idseq-database/taxonomy/#{ncbi_date}"
                      else
                        ENV['REFERENCE_S3_FOLDER'].gsub(%r{([/]*$)}, '') # trim any trailing '/'
                      end

  current_version = TaxonLineage.maximum('version_end')
  if !current_version || current_version < TaxonLineage.maximum('version_start')
    raise "Bad current_version: #{current_version}"
  end

  puts "\n\nStarting import of #{reference_s3_path} ...\n\n"
  importer = LineageDatabaseImporter.new(reference_s3_path, ncbi_date, current_version)
  importer.import!(testrun)
  puts "\n\nDone import of #{reference_s3_path}."

  ## Instructions on next steps
  # TODO: Add is_vector property to taxa and refactor phages list generation
  # https://jira.czi.team/browse/IDSEQ-1564
  puts "To complete this lineage update, you should now update PHAGE_FAMILIES_TAXIDS and PHAGE_TAXIDS in TaxonLineageHelper using the queries described therein."
end

class LineageDatabaseImporter
  def initialize(reference_s3_path, ncbi_date, current_version)
    @reference_s3_path = reference_s3_path
    @ncbi_date = ncbi_date
    @local_taxonomy_path = "/app/tmp/taxonomy/#{ncbi_date}"
    @names_table = "_new_names"
    @taxid_table = "_new_taxid_lineages"
    @taxon_lineages_table = "_new_taxon_lineages"
    @current_version = current_version

    # columns compared between old and new taxon_lineages
    @columns = [
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
    @new_columns = ["taxid", "started_at", "version_start", "version_end"] + @columns
  end

  def new_version
    @current_version + 1
  end

  def host
    Rails.env == 'development' ? 'db' : '$RDS_ADDRESS'
  end

  def lp
    Rails.env == 'development' ? '' : '--user=$DB_USERNAME --password=$DB_PASSWORD'
  end

  def import!(testrun = false)
    setup

    if testrun
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
    upgrade_taxon_lineages!
  end

  def upgrade_taxon_lineages!
    puts "\nRetire records..."
    retire_ids = retire_records_ids
    puts "#{retire_ids.count} records"

    puts "\nInsert records..."
    insert_ids = insert_records_ids
    puts "#{insert_ids.count} records"

    puts "\nUpdate records..."
    update_ids = update_records_ids
    puts "#{update_ids.count} records"

    puts "\nKeep same records..."
    unchanged_ids = unchanged_records_ids
    puts "#{unchanged_ids.count} records"

    check_user_input

    TaxonLineage.connection.transaction do # BEGIN
      TaxonLineage.connection.transaction(requires_new: true) do # CREATE SAVEPOINT
        execute_upgrade(
          retire_ids,
          insert_ids,
          update_ids,
          unchanged_ids
        )
      end
    end
  end

  def import_new_names!
    # modified from original file "tax_id,name_txt,name_txt_common" for convenience
    names_cols = 'taxid,name,common_name'
    TaxonLineage.connection.update(
      create_table_sql(@names_table, names_cols.split(','))
    )
    shell_execute(
      mysql_import(names_cols, @names_table)
    )
    TaxonLineage.connection.update(
      "ALTER TABLE #{@names_table} ADD UNIQUE idx(taxid(255))"
    )
  end

  def import_new_taxid_lineages!
    column_names = "taxid,superkingdom_taxid,kingdom_taxid,phylum_taxid,class_taxid,order_taxid,family_taxid,genus_taxid,species_taxid"
    TaxonLineage.connection.update(create_table_sql(@taxid_table, column_names.split(',')))
    shell_execute(mysql_import(column_names, @taxid_table))
  end

  private

  def check_user_input
    puts "Do you wish to execute the above irreversible changes? [y/N]"
    input = STDIN.gets.strip
    if input != "y"
      raise "lineage database update aborted"
    end
  end

  def check_shell_status
    raise "lineage database update failed" unless $CHILD_STATUS.success?
  end

  def check_affected(affected)
    if affected != ids.count
      raise "Wrong number of rows affected"
    end
  end

  def setup
    `
     set -e
     ## Set work directory
     rm -rf #{@local_taxonomy_path};
     mkdir -p #{@local_taxonomy_path};
     cd #{@local_taxonomy_path};

     ## Check database connection
     mysql -h #{host} #{lp} -e "SELECT 1"
     mysql -h #{host} #{lp} -D idseq_#{Rails.env} -e "
      DROP TABLE IF EXISTS #{@names_table};
      DROP TABLE IF EXISTS #{@taxid_table};
      DROP TABLE IF EXISTS #{@taxon_lineages_table};"
    `
    check_shell_status
  end

  def aws_s3_cp(file_name, table_name)
    "aws s3 cp #{@reference_s3_path}/#{file_name}.gz - | gunzip | tail -n +2 > #{table_name}.csv"
  end

  def shell_execute(*commands)
    puts `
    set -e
    cd #{@local_taxonomy_path}
    #{commands.join("\n")}
    `
    check_shell_status
  end

  def mysql_import(cols, table_name)
    "mysqlimport --verbose --local --host=#{host} #{lp} --columns=#{cols} --fields-terminated-by=',' idseq_#{Rails.env} #{table_name}.csv"
  end

  def create_table_sql(table_name, cols)
    col_defs = cols.map { |c| "#{c} text" }.join(', ')
    "CREATE TABLE #{table_name}(#{col_defs})"
  end

  def build_new_taxon_lineages!
    TaxonLineage.connection.update(
      create_table_sql(@taxon_lineages_table, @new_columns)
    )
    TaxonLineage.connection.update(
      "ALTER TABLE #{@taxon_lineages_table} ADD UNIQUE idx(taxid(255))"
    )

    col_expressions = @columns.map do |col|
      table, name_col = col.split('_', 2)
      # need to escape because of "order"
      "`#{table}`.#{name_col}"
    end

    TaxonLineage.connection.update("
      INSERT INTO #{@taxon_lineages_table}
      SELECT l.taxid,
      #{@ncbi_date},
      #{new_version},
      #{new_version},
      #{col_expressions.join(', ')}
      FROM #{@taxid_table} l
      JOIN #{@names_table} superkingdom ON l.superkingdom_taxid = superkingdom.taxid
      JOIN #{@names_table} kingdom ON l.kingdom_taxid = kingdom.taxid
      JOIN #{@names_table} phylum ON l.phylum_taxid = phylum.taxid
      JOIN #{@names_table} class ON l.class_taxid = class.taxid
      JOIN #{@names_table} `order` ON l.order_taxid = `order`.taxid
      JOIN #{@names_table} family ON l.family_taxid = family.taxid
      JOIN #{@names_table} genus ON l.genus_taxid = genus.taxid
      JOIN #{@names_table} species ON l.species_taxid = species.taxid")
  end

  def retire_records_ids
    TaxonLineage.connection.select_all(
      "SELECT old.taxid
      FROM taxon_lineages old
      LEFT JOIN _new_taxon_lineages new USING(taxid)
      WHERE new.taxid IS NULL
        AND old.version_end = #{@current_version}"
    ).pluck("taxid")
  end

  def insert_records_ids
    TaxonLineage.connection.select_all(
      "SELECT new.taxid
      FROM taxon_lineages old
      RIGHT JOIN _new_taxon_lineages new USING(taxid)
      WHERE old.taxid IS NULL"
    ).pluck("taxid")
  end

  def update_records_ids
    col_expressions = @columns.map do |col|
      "old.#{col} != new.#{col}"
    end

    TaxonLineage.connection.select_all(
      "SELECT old.taxid
      FROM taxon_lineages old
      INNER JOIN _new_taxon_lineages new USING(taxid)
      WHERE old.version_end = #{@current_version}
        AND (#{col_expressions.join("\n OR ")})"
    ).pluck("taxid")
  end

  def unchanged_records_ids
    col_expressions = @columns.map do |col|
      "old.#{col} = new.#{col}"
    end

    TaxonLineage.connection.select_all(
      "SELECT old.taxid FROM taxon_lineages old
      INNER JOIN _new_taxon_lineages new USING(taxid)
      WHERE old.version_end = #{@current_version}
        AND #{col_expressions.join("\n AND ")}"
    ).pluck("taxid")
  end

  def execute_upgrade(retire_ids, insert_ids, update_ids, unchanged_ids)
    check_affected(TaxonLineage.connection.update("
      UPDATE taxon_lineages
      SET ended_at = '#{@ncbi_date}' version_end = #{@current_version}
      WHERE id IN (#{retire_ids.join(', ')})
    "), retire_ids)

    check_affected(TaxonLineage.connection.update("
      INSERT INTO taxon_lineages(#{@new_columns.join(', ')})
      SELECT #{@new_columns.join(', ')}
      FROM #{@taxon_lineages_table}
      WHERE id IN (#{insert_ids.join(', ')})
    "), insert_ids)

    check_affected(TaxonLineage.connection.update("
      REPLACE INTO taxon_lineages(#{@new_columns.join(', ')})
      SELECT #{@new_columns.join(', ')}
      FROM #{@taxon_lineages_table}
      WHERE id IN (#{update_ids.join(', ')})
    "), update_ids)

    check_affected(TaxonLineage.connection.update("
      UPDATE taxon_lineages
      SET version_end = #{@new_version}
      WHERE id IN (#{unchanged_ids.join(', ')})
    "), unchanged_ids)
  end

  def clean_up
    `
     set -xe
     ## Clean up
     rm -rf #{@local_taxonomy_path}
     mysql -h #{host} #{lp} -D idseq_#{Rails.env} -e "
      DROP TABLE IF EXISTS #{@taxid_table};
      DROP TABLE IF EXISTS #{@names_table};
     "
    `
    check_shell_status
  end
end

# Determined by all tax_ids in random sample below,
# plus test inserts and updates.
def example_names_csv
  "99999999,Test,test insert new taxid
99999998,Test,test update taxid
2759,Eukaryota,eucaryotes
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
41094,Dermestidae,skin and larder beetles
50557,Insecta,true insects
70160,Anguillicolidae,
70161,Anguillicola,
82593,Geometridae,geometer moths
103887,Bionectriaceae,
119089,Chromadorea,
142998,Pseudotrismegistia undulata,
147550,Sordariomycetes,
153373,Cricotopus,
214137,Eupithecia,
224610,Promyrmekiaphila,
241409,Geosmithia,
305609,Coenosia,
324114,Pseudotrismegistia,
404319,Pylaisiadelphaceae,
441264,Caenocara,
441265,Caenocara cf. tsuchiguri MSL2007,
461026,Promyrmekiaphila sp. FTRb2,
620899,Anguillicola papernai,
1283840,Euctenizidae,
1333032,Eupithecia sp. BOLD:AAP1678,
1720211,Camponotus sp. 1 CT-2015,
2213681,Coenosia sp. BIOUG19916-C11,
2401214,Cricotopus sp. BIOUG30446-A09,
2518203,Geosmithia sp. 22 YTH-2019,"
end

# Determined by random sample of full set
def example_taxid_lineages_csv
  # First row is for testing inserts
  # Second row is for testing updates
  # 9 unchanged rows
  "99999999,99999999,99999999,99999999,99999999,99999999,99999999,99999999,99999999
1588501,99999998,99999998,99999998,99999998,99999998,99999998,99999998,99999998
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
