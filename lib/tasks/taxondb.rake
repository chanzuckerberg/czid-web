require 'open3'
require 'csv'
task load_taxon_db: :environment do
  nodes_s3_file = "nodes.dmp"
  categories_s3_file = "categories.dmp"
  s3_taxonomy_path = "s3://czbiohub-infectious-disease/taxonomy"
  local_taxonomy_path = "/app/tmp/taxonomy"
  command = "mkdir -p #{local_taxonomy_path};"
  command += "aws s3 cp #{s3_taxonomy_path} #{local_taxonomy_path} --recursive;"
  Open3.capture3(command)
  nodes_file = "#{local_taxonomy_path}/#{nodes_s3_file}"
  categories_file = "#{local_taxonomy_path}/#{categories_s3_file}"
  %x[cd #{local_taxonomy_path};
     awk -F "\t|\t" '{print x+=1,","$1","$3","$5",2017-10-04,2017-10-04"}' #{nodes_file} | sed 's= ,=,=' > taxon_child_parents;
     mysqlimport --local --user=$DB_USERNAME --host=$RDS_ADDRESS --password=$DB_PASSWORD --fields-terminated-by=',' idseq_#{Rails.env} taxon_child_parents]
  %x[cd #{local_taxonomy_path};
     awk -F "\t" '{print x+=1,","$3","$1",2017-10-04,2017-10-04"}' #{categories_file} | sed 's= ,=,=' > taxon_categories;
     mysqlimport --local --user=$DB_USERNAME --host=$RDS_ADDRESS --password=$DB_PASSWORD --fields-terminated-by=',' idseq_#{Rails.env} taxon_categories]
  Open3.capture3("rm -rf #{local_taxonomy_path}")
end
