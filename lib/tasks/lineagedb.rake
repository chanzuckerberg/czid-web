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
  date = `date +"%Y-%m-%d"`.strip
  taxid_lineages_file = 'taxid-lineages.csv'
  names_file = 'names.csv'
  preload = true
  preload_s3_path = 's3://czbiohub-infectious-disease/taxonomy'

  ` mkdir -p #{local_taxonomy_path};
    cd #{local_taxonomy_path};

    # get necessary software
    git clone https://github.com/chanzuckerberg/ncbitax2lin.git;

    # generate CSV files with lineage and name information
    cd ncbitax2lin;
    if #{preload}; then 
      aws s3 cp #{preload_s3_path}/#{taxid_lineages_file}.gz .
      aws s3 cp #{preload_s3_path}/#{names_file}.gz .
    else
      make
    fi

    # import to database
    gunzip *.csv.gz;
    tail -n+2 #{taxid_lineages_file} | awk -F "," '{print x+=1,","$0",#{date},#{date}"}' | sed 's= ,=,=' > taxon_lineages;
    mysqlimport --delete --local --user=$DB_USERNAME --host=#{host} --password=$DB_PASSWORD --fields-terminated-by=',' idseq_#{Rails.env} taxon_lineages;
    tail -n+2 #{names_file} | awk -F "," '{print x+=1,","$0",#{date},#{date}"}' | sed 's= ,=,=' > taxon_names;
    mysqlimport --delete --local --user=$DB_USERNAME --host=#{host} --password=$DB_PASSWORD --fields-terminated-by=',' idseq_#{Rails.env} taxon_names;
    cd /app;
    rm -rf #{local_taxonomy_path};
  `
  raise "lineage database import failed" unless $CHILD_STATUS.success?
end
