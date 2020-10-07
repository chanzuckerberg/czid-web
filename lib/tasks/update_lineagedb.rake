require 'open3'
require 'csv'
require 'English'

desc 'Imports NCBI lineage data into IDseq'
# When our NCBI indexes are updated, we should run this script.
#
# NCBI publishes unversioned dumps of its taxonomy database. This script
# imports a previously downloaded dump into MySQL, denormalizes it, and inserts
# the rows into taxon_lineages. We insert only new records and update the rest.
#
# Lineage records are assigned a [version_start, version_end] inclusive range.
# Each pipline run has an AlignmentConfig that has a lineage_version. The
# pipeline should only count lineages where:
#
#  lineage_version BETWEEN
#   taxon_lineages.version_start
#   AND taxon_lineages.version_end
#
# See PipelineRun#generate_aggregate_counts. The version filter is also applied
# when loading the sample report page. See fetch_lineage_by_taxid.
#
# In summary:
# If a current lineage record is still valid, its version_end gets += 1.
# If a current lineage record is different in any column, it is updated.
# If a new lineage record appears, it is inserted.
# If a current lineage record is absent, its version_end stays the same.
#
# The script will check that the number of records in the first three groups is
# equal to the number of records in the NCBI input files, and it will check
# that all four groups are disjoint.
#
# A useful query for inspecting the table is:
# SELECT created_at, started_at, version_start, ended_at,
# version_end, count(*) FROM taxon_lineages GROUP BY created_at,
# started_at, version_start, ended_at, version_end \G;
task 'update_lineage_db', [:run_mode] => :environment do |_t, args|
  ### Short Usage: NCBI_DATE=2018-12-01 rake update_lineage_db
  ### Full Usage: REFERENCE_S3_FOLDER=s3://idseq-database/taxonomy/2018-12-01 rake update_lineage_db
  ### Note(2020-06-10): This will change to a new bucket name in idseq-prod account.
  ### REFERENCE_S3_FOLDER needs to contain names.csv.gz and taxid-lineages.csv.gz

  Logging.logger.root.level = :info

  testrun = args.run_mode == "testrun"
  noverify = args.run_mode == "noverify"
  puts "\n\nTEST RUN - LOCAL DATA" if testrun

  ncbi_date = ENV['NCBI_DATE']
  reference_s3_path = if ncbi_date.present?
                        "s3://#{S3_DATABASE_BUCKET}/taxonomy/#{ncbi_date}"
                      else
                        ENV['REFERENCE_S3_FOLDER'].gsub(%r{([/]*$)}, '') # trim any trailing '/'
                      end

  current_version = TaxonLineage.maximum('version_end')
  if current_version.nil?
    puts "\n\nNO PREVIOUS VERSION FOUND - INITIAL IMPORT"
    current_version = 0
  elsif current_version < TaxonLineage.maximum('version_start')
    raise "Bad current_version: #{current_version}"
  end

  puts "\n\nStarting import of #{reference_s3_path} ...\n\n"
  importer = LineageDatabaseImporter.new(reference_s3_path, ncbi_date, current_version)
  importer.import!(testrun, noverify)
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
    @new_columns = [
      "taxid",
      "started_at",
      "version_start",
      "version_end",
      "created_at",
      "updated_at",
    ] + @columns
  end

  def new_version
    @current_version + 1
  end

  def host
    Rails.env.development? ? 'db' : '$RDS_ADDRESS'
  end

  def lp
    Rails.env.development? ? '' : '--user=$DB_USERNAME --password=$DB_PASSWORD'
  end

  def import!(testrun = false, noverify = false)
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
    affected = build_new_taxon_lineages!
    upgrade_taxon_lineages!(affected, noverify)
    # This is very slow, since this script is using raw SQL the
    #  elasticsearch index will not be updated, since elasticsearch-model
    #  relies on callbacks. The safest and easiest way to ensure the
    #  index is in sync at the end is to refresh the whole thing.
    #  Since this script is run rarely this shouldn't be a huge deal
    #  but if it is slow you may want to look into only updating affected ids.
    import_elasticsearch!
  end

  def import_elasticsearch!
    puts "\nRefresh elasticsearch index..."
    # There may be potential to optimize this based on the diff but:
    # - Going through the ID and calling index would likely be slower
    #   because import implements batching.
    # - Using a query import based on updated timestamp misses
    #   deletions.
    TaxonLineage.__elasticsearch__.import force: true
  end

  def upgrade_taxon_lineages!(new_count, noverify = false)
    puts "\nRetire records..."
    retire_ids = retire_records_ids
    puts "#{retire_ids.count} records"

    puts "\nInsert records..."
    insert_ids = insert_records_ids
    puts "#{insert_ids.count} records"

    puts "\nUpdate records..."
    update_ids = update_records_ids
    puts "#{update_ids.count} records"

    puts "\nKeep active records..."
    unchanged_ids = unchanged_records_ids
    puts "#{unchanged_ids.count} records"

    upgrade_ids = (insert_ids + update_ids + unchanged_ids)
    upgrade_count = upgrade_ids.count

    if new_count != upgrade_count && !noverify
      # Should be investigated if counts are mismatched before ignoring. You can spot check taxids
      # on NCBI. Ex: Some taxids may have no Rank, so they won't be used in IDseq.
      new_ids = TaxonLineage.connection.select_all("SELECT taxid FROM #{@taxid_table}").pluck("taxid")

      puts "Only in new_ids: "
      (new_ids - upgrade_ids).each { |tax_id| puts "https://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?mode=Info&id=#{tax_id}" }

      puts "\nOnly in upgrade_ids: "
      (upgrade_ids - new_ids).each { |tax_id| puts "https://www.ncbi.nlm.nih.gov/Taxonomy/Browser/wwwtax.cgi?mode=Info&id=#{tax_id}" }

      raise "Mismatched upgrade counts: #{new_count} and #{upgrade_count}. Try running update_lineage_db[noverify]."
    end

    if upgrade_count == unchanged_ids.count
      raise "No upgrades to make"
    end

    if (insert_ids + update_ids + unchanged_ids + retire_ids).uniq.count != upgrade_count + retire_ids.count
      raise "Upgrade sets are not disjoint"
    end

    check_user_input

    TaxonLineage.connection.transaction do
      TaxonLineage.connection.transaction do
        execute_upgrade!(retire_ids, insert_ids, update_ids, unchanged_ids)
      end
    end
  end

  def add_table_index(table_name, col = "taxid")
    "ALTER TABLE #{table_name} ADD UNIQUE idx(#{col})"
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
    TaxonLineage.connection.update(add_table_index(@names_table))
  end

  def import_new_taxid_lineages!
    column_names = "taxid,superkingdom_taxid,kingdom_taxid,phylum_taxid,class_taxid,order_taxid,family_taxid,genus_taxid,species_taxid"
    TaxonLineage.connection.update(create_table_sql(@taxid_table, column_names.split(',')))
    shell_execute(mysql_import(column_names, @taxid_table))
    TaxonLineage.connection.update(add_table_index(@taxid_table))
  end

  private

  def check_user_input
    puts "\nDo you wish to execute the above irreversible changes? [y/N]"
    input = STDIN.gets.strip
    if input != "y"
      raise "lineage database update aborted"
    end
  end

  def check_shell_status
    raise "lineage database update failed" unless $CHILD_STATUS.success?
  end

  def check_affected(sql, expected)
    puts "\n\nExecuting to affect #{expected} rows:\n#{sql}"
    affected = TaxonLineage.connection.update(sql)
    if affected != expected
      raise "Wrong number of rows affected: #{affected} and #{expected}"
    end

    affected
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
    col_defs = cols.map do |col|
      col_type = col.end_with?('taxid') ? 'INT(11)' : 'VARCHAR(255)'
      "#{col} #{col_type} NOT NULL"
    end.join(', ')
    "CREATE TABLE #{table_name}(#{col_defs})"
  end

  def build_new_taxon_lineages!
    taxid_table_count = TaxonLineage.connection.select_value("
      SELECT COUNT(*) FROM #{@taxid_table}
    ")
    names_table_count = TaxonLineage.connection.select_value("
      SELECT COUNT(*) FROM #{@names_table}
    ")
    if taxid_table_count > names_table_count
      raise "Mismatched counts in input tables: #{taxid_table_count} and #{names_table_count}"
    end

    TaxonLineage.connection.update(
      create_table_sql(@taxon_lineages_table, @new_columns)
    )
    TaxonLineage.connection.update(
      add_table_index(@taxon_lineages_table)
    )

    col_expressions = @columns.map do |col|
      table, name_col = col.split('_', 2)
      if name_col == 'taxid'
        # need to use taxid_table because it has negative taxids
        col
      else
        # need to escape table because of "order"
        # coerce NULLs to empty string '' for taxon_lineages
        "COALESCE(`#{table}`.#{name_col}, '')"
      end
    end

    check_affected("
      INSERT INTO #{@taxon_lineages_table}
      SELECT l.taxid,
      '#{@ncbi_date}',
      #{new_version},
      #{new_version},
      CURRENT_TIMESTAMP(),
      CURRENT_TIMESTAMP(),
      #{col_expressions.join(', ')}
      FROM #{@taxid_table} l
      LEFT JOIN #{@names_table} superkingdom ON l.superkingdom_taxid = superkingdom.taxid
      LEFT JOIN #{@names_table} kingdom ON l.kingdom_taxid = kingdom.taxid
      LEFT JOIN #{@names_table} phylum ON l.phylum_taxid = phylum.taxid
      LEFT JOIN #{@names_table} class ON l.class_taxid = class.taxid
      LEFT JOIN #{@names_table} `order` ON l.order_taxid = `order`.taxid
      LEFT JOIN #{@names_table} family ON l.family_taxid = family.taxid
      LEFT JOIN #{@names_table} genus ON l.genus_taxid = genus.taxid
      LEFT JOIN #{@names_table} species ON l.species_taxid = species.taxid
      WHERE
        -- missing taxon ranks should be represented by negative numbers
        IF(superkingdom.taxid IS NULL, superkingdom_taxid < 0, 1)
        AND IF(kingdom.taxid IS NULL, kingdom_taxid < 0, 1)
        AND IF(phylum.taxid IS NULL, phylum_taxid < 0, 1)
        AND IF(class.taxid IS NULL, class_taxid < 0, 1)
        AND IF(`order`.taxid IS NULL, order_taxid < 0, 1)
        AND IF(family.taxid IS NULL, family_taxid < 0, 1)
        AND IF(genus.taxid IS NULL, genus_taxid < 0, 1)
        AND IF(species.taxid IS NULL, species_taxid < 0, 1)
      ", taxid_table_count)
  end

  def retire_records_ids
    TaxonLineage.connection.select_all(
      "SELECT old.taxid
      FROM taxon_lineages old
      LEFT JOIN #{@taxon_lineages_table} new USING(taxid)
      WHERE new.taxid IS NULL
        AND old.version_end = #{@current_version}"
    ).pluck("taxid")
  end

  def insert_records_ids
    TaxonLineage.connection.select_all(
      "SELECT new.taxid
      FROM taxon_lineages old
      RIGHT JOIN #{@taxon_lineages_table} new USING(taxid)
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
      INNER JOIN #{@taxon_lineages_table} new USING(taxid)
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
      INNER JOIN #{@taxon_lineages_table} new USING(taxid)
      WHERE old.version_end = #{@current_version}
        AND #{col_expressions.join("\n AND ")}"
    ).pluck("taxid")
  end

  def execute_upgrade!(retire_ids, insert_ids, update_ids, unchanged_ids)
    # special case initial population
    if retire_ids.count + update_ids.count + unchanged_ids.count == 0
      return check_affected("
        INSERT INTO taxon_lineages(#{@new_columns.join(', ')})
        SELECT #{@new_columns.join(', ')}
        FROM #{@taxon_lineages_table}
      ", insert_ids.count)
    end

    if retire_ids.count > 0
      check_affected("
        UPDATE taxon_lineages
        SET ended_at = '#{@ncbi_date}'
        WHERE (taxid IN (#{retire_ids.join(', ')}))
          AND version_end = #{@current_version}
      ", retire_ids.count)
    end

    if insert_ids.count > 0
      check_affected("
        INSERT INTO taxon_lineages(#{@new_columns.join(', ')})
        SELECT #{@new_columns.join(', ')}
        FROM #{@taxon_lineages_table} new
        WHERE new.taxid IN (#{insert_ids.join(', ')})
      ", insert_ids.count)
    end

    if update_ids.count > 0
      check_affected("
        DELETE FROM taxon_lineages
        WHERE taxid IN (#{update_ids.join(', ')})
          AND version_end = #{@current_version}
      ", update_ids.count)
      check_affected("
        INSERT INTO taxon_lineages(#{@new_columns.join(', ')})
        SELECT #{@new_columns.join(', ')}
        FROM #{@taxon_lineages_table} new
        WHERE new.taxid IN (#{update_ids.join(', ')})
      ", update_ids.count)
    end

    # Use NOT IN to avoid too large IN clause
    check_affected("
      UPDATE taxon_lineages
      SET version_end = #{new_version}
      WHERE (taxid NOT IN (#{retire_ids.join(', ')}))
        AND version_end = #{@current_version}
    ", unchanged_ids.count)
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

# First row is for testing inserts
# Second row is for testing updates
# Third row is unknown values
# 9 unchanged rows by random sample of full set
def example_taxid_lineages_csv
  "99999999,99999999,99999999,99999999,99999999,99999999,99999999,99999999,99999999
1588501,99999998,99999998,99999998,99999998,99999998,99999998,99999998,99999998
1,-700,-650,-600,-500,-400,-300,-200,-100
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
