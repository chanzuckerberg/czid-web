require 'open3'
require 'csv'
require 'English'
task load_lineage_db: :environment do
  local_taxonomy_path = "/app/tmp/taxonomy"
  old_lineage_csv = "#{local_taxonomy_path}/taxon_lineages.csv"
  column_names = "taxid,superkingdom_taxid,phylum_taxid,class_taxid,order_taxid,family_taxid,genus_taxid,species_taxid," \
    "superkingdom_name,superkingdom_common_name,phylum_name,phylum_common_name,class_name,class_common_name," \
    "order_name,order_common_name,family_name,family_common_name,genus_name,genus_common_name,species_name,species_common_name"
  host = Rails.env == 'development' ? 'db' : '$RDS_ADDRESS'
  taxid_lineages_file = 'taxid-lineages.csv'
  names_file = 'names.csv'
  reference_s3_path = 's3://czbiohub-infectious-disease/references'
  `
   ## Set work directory
   mkdir -p #{local_taxonomy_path};
   cd #{local_taxonomy_path};

   ## Get old lineage file
   mysql -h #{host} -u $DB_USERNAME --password=$DB_PASSWORD -e "SELECT #{column_names} FROM idseq_#{Rails.env}.taxon_lineages;" | tr "\t" "," > old_taxon_lineages.csv

   ## Get new lineage file
   # Download new references
   aws s3 cp #{reference_s3_path}/#{taxid_lineages_file}.gz - | gunzip > taxid-lineages.csv
   aws s3 cp #{reference_s3_path}/#{names_file}.gz - | gunzip > names.csv
   # names.csv has columns: tax_id,name_txt,name_txt_common
   # taxid-lineages.csv has columns: tax_id,superkingdom,phylum,class,order,family,genus,species
   # Now perform series of joins to produce the format in column_names.
   file1_ncol=8
   file1_output_cols=1.1,1.2,1.3,1.4,1.5,1.6,1.7,1.8
   sort -k1 -t, names.csv > names_sorted.csv
   for i in 2 3 4 5 6 7 8; do
     sort -k$i -t, taxid-lineages.csv > taxid-lineages_sorted.csv;
     join -t, -1 $i -2 1 -a 1 -o${file1_output_cols},2.2,2.3 taxid-lineages_sorted.csv names_sorted.csv > taxid-lineages.csv;
     file1_output_cols=${file1_output_cols},1.$((${file1_ncol}+1)),1.$((${file1_ncol}+2));
     file1_ncol=$((${file1_ncol}+2));
   done;

   ## Compute diff
   sort old_taxon_lineages.csv > old_taxon_lineages_sorted.csv
   sort taxid-lineages.csv > new_taxon_lineages_sorted.csv
   comm -23 old_taxon_lineages_sorted.csv new_taxon_lineages_sorted.csv > records_to_retire.csv
   comm -13 old_taxon_lineages_sorted.csv new_taxon_lineages_sorted.csv > records_to_insert.csv

   ## mysqlimport...

   ## Clean up
   rm -rf #{local_taxonomy_path};
  `
  raise "lineage database import failed" unless $CHILD_STATUS.success?
end
