require 'open3'
require 'csv'
require 'English'
task update_lineage_db: :environment do
  ### Usage: REFERENCE_S3_FOLDER=s3://idseq-database/taxonomy/2018-02-15-utc-1518652800-unixtime__2018-02-15-utc-1518652800-unixtime rake update_lineage_db
  ### REFERENCE_S3_FOLDER needs to contain names.csv.gz and taxid-lineages.csv.gz

  reference_s3_path = ENV['REFERENCE_S3_FOLDER'].gsub(%r{([/]*$)}, '') # trim any trailing '/'
  local_taxonomy_path = "/app/tmp/taxonomy"
  name_column_array = %w[superkingdom_name superkingdom_common_name kingdom_name kingdom_common_name phylum_name phylum_common_name class_name class_common_name
                         order_name order_common_name family_name family_common_name genus_name genus_common_name species_name species_common_name]
  column_names = "taxid,superkingdom_taxid,kingdom_taxid,phylum_taxid,class_taxid,order_taxid,family_taxid,genus_taxid,species_taxid," +
                 name_column_array.join(",")
  n_columns = column_names.split(",").count
  host = Rails.env == 'development' ? 'db' : '$RDS_ADDRESS'
  taxid_lineages_file = 'taxid-lineages.csv'
  names_file = 'names.csv'
  current_date = Time.now.utc
  `
   ## Set work directory
   mkdir -p #{local_taxonomy_path};
   cd #{local_taxonomy_path};

   ## Get old lineage file
   mysql -h #{host} -u $DB_USERNAME --password=$DB_PASSWORD -e "SELECT #{column_names},started_at FROM idseq_#{Rails.env}.taxon_lineages WHERE ended_at = (SELECT MAX(ended_at) FROM idseq_#{Rails.env}.taxon_lineages);" | tr "\t" "," | tail -n +2 > old_taxon_lineages_with_started_at.csv
   cut -d, -f1-#{n_columns} old_taxon_lineages_with_started_at.csv > old_taxon_lineages.csv
   cut -d, -f1,#{n_columns + 1} old_taxon_lineages_with_started_at.csv > taxid_to_started_at.csv

   ## Get new lineage file
   # Download new references, extract and remove header line
   aws s3 cp #{reference_s3_path}/#{taxid_lineages_file}.gz - | gunzip | tail -n +2 > taxid-lineages.csv
   aws s3 cp #{reference_s3_path}/#{names_file}.gz - | gunzip | tail -n +2 > names.csv
   # names.csv has columns: tax_id,name_txt,name_txt_common
   # taxid-lineages.csv has columns: tax_id,superkingdom,kingdom,phylum,class,order,family,genus,species
   # Now perform series of joins to produce the format in column_names.
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
   mv records_to_retire.csv taxon_lineages
   mysqlimport --replace --local --user=$DB_USERNAME --host=#{host} --password=$DB_PASSWORD --columns=#{column_names},ended_at,started_at --fields-terminated-by=',' idseq_#{Rails.env} taxon_lineages;
   # new records:
   mv records_to_insert.csv taxon_lineages
   mysqlimport --local --user=$DB_USERNAME --host=#{host} --password=$DB_PASSWORD --columns=#{column_names},started_at --fields-terminated-by=',' idseq_#{Rails.env} taxon_lineages;

   ## Clean up
   rm -rf #{local_taxonomy_path};
  `
  raise "lineage database update failed" unless $CHILD_STATUS.success?
  puts "To complete this lineage update, you should now update PHAGE_FAMILIES_TAXIDS and PHAGE_TAXIDS in TaxonLineageHelper using the queries described therein."
  puts "You should also overwrite app/lib/taxon_search_list.json with the output of TaxonLineage.taxon_search_list."
end
