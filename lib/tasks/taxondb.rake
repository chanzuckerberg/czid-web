# taxon_child_parents has ~1.6M rows; taxon_categopries ~1.5M.
# The backtick block in this task completes in a few seconds,
# whereas iterating over the lines in the files and inserting
# the records in the database one-by-one would take hours.
require 'open3'
require 'csv'
require 'English'
task load_taxon_db: :environment do
  remote_taxdump_path = "ftp://ftp.ncbi.nih.gov/pub/taxonomy/taxdump.tar.gz"
  remote_taxcat_path = "ftp://ftp.ncbi.nih.gov/pub/taxonomy/taxcat.tar.gz"
  local_taxonomy_path = "/app/tmp/taxonomy"
  nodes_file = "nodes.dmp"
  categories_file = "categories.dmp"
  host = if Rails.env == 'development'
           'db'
         else
           '$RDS_ADDRESS'
         end
  date = `date +"%Y-%m-%d"`.strip
  `
    mkdir -p #{local_taxonomy_path};
    cd #{local_taxonomy_path};
    wget #{remote_taxdump_path};
    tar xvf $(basename #{remote_taxdump_path});
    wget #{remote_taxcat_path};
    tar xvf $(basename #{remote_taxcat_path});
    awk -F "\t|\t" '{print x+=1,","$1","$3","$5",#{date},#{date}"}' #{nodes_file} | sed 's= ,=,=' > taxon_child_parents;
    mysqlimport --delete --local --user=$DB_USERNAME --host=#{host} --password=$DB_PASSWORD --fields-terminated-by=',' idseq_#{Rails.env} taxon_child_parents;
    awk -F "\t" '{print x+=1,","$3","$1",#{date},#{date}"}' #{categories_file} | sed 's= ,=,=' > taxon_categories;
    mysqlimport --delete --local --user=$DB_USERNAME --host=#{host} --password=$DB_PASSWORD --fields-terminated-by=',' idseq_#{Rails.env} taxon_categories;
  `
  raise "taxon database import failed" unless $CHILD_STATUS.success?
  Open3.capture3("rm -rf #{local_taxonomy_path}")
end
