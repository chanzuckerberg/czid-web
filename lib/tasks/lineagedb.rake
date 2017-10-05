require 'open3'
require 'csv'
require 'English'
task load_lineage_db: :environment do
  local_taxonomy_path = "/app/tmp/taxonomy"
  host = if Rails.env == 'development'
         'db'
       else
         '$RDS_ADDRESS'
       end
  date = `date +"%Y-%m-%d"`
  taxid_lineages_file = 'taxid-lineages.csv'
  names_file = 'names.csv'

  `
    # generate CSV files with lineage and name information
    cd /app/ncbitax2lin;
    make;
    mv *.csv.gz #{local_taxonomy_path}/;

    # import to database
    cd #{local_taxonomy_path};
    gunzip *.csv.gz;
    awk -F "," '{print x+=1,","$0",",#{date},#{date}"}' #{taxid_lineages_file} | sed 's= ,=,=' > taxon_lineages;
    mysqlimport --local --user=$DB_USERNAME --host=#{host} --password=$DB_PASSWORD --fields-terminated-by=',' idseq_#{Rails.env} taxon_lineages;
    awk -F "," '{print x+=1,","$0",#{date},#{date}"}' #{names_file} | sed 's= ,=,=' > taxon_names;
    mysqlimport --local --user=$DB_USERNAME --host=#{host} --password=$DB_PASSWORD --fields-terminated-by=',' idseq_#{Rails.env} taxon_names;
    cd /app;
    rm -rf #{local_taxonomy_path}
  `
  raise "lineage database import failed" unless $CHILD_STATUS.success?
end
