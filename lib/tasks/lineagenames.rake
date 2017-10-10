require 'open3'
require 'csv'
require 'English'
task load_lineage_name_db: :environment do
  local_taxonomy_path = "/app/tmp/taxonomy"
  host = if Rails.env == 'development'
           'db'
         else
           '$RDS_ADDRESS'
         end
  date = `date +"%Y-%m-%d"`.strip
  lineages_file = 'lineages.csv'
  preload = true
  preload_s3_path = 's3://czbiohub-infectious-disease/taxonomy'

  ` mkdir -p #{local_taxonomy_path};
    cd #{local_taxonomy_path};
    # get necessary software
    git clone https://github.com/chanzuckerberg/ncbitax2lin.git;
    # generate CSV files with lineage and name information
    cd ncbitax2lin;
    if #{preload}; then
      aws s3 cp #{preload_s3_path}/#{lineages_file}.gz .
    else
      make
    fi
    # import to database
    gunzip *.csv.gz;
    tail -n+2 #{lineages_file} | awk -F "," '{print x+=1,","$0",#{date},#{date}"}' | sed 's= ,=,=' > taxon_lineage_names;
    mysqlimport --delete --local --user=$DB_USERNAME --host=#{host} --password=$DB_PASSWORD --fields-terminated-by=',' idseq_#{Rails.env} taxon_lineage_names;
    cd /app;
    rm -rf #{local_taxonomy_path};
  `
  raise "lineage database import failed" unless $CHILD_STATUS.success?
end
