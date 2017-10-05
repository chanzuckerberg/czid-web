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

  ## "/app/tmp/taxonomy" and "idseq_dev" to be abstracted out
  %x{cd /app/tmp/taxonomy; awk -F "\t|\t" '{print x+=1,","$1","$3","$5",2017-10-04,2017-10-04"}' nodes.dmp | sed 's= ,=,=' > taxon_child_parents; mysqlimport --local --user=$DB_USERNAME --host=$RDS_ADDRESS --password=$DB_PASSWORD --fields-terminated-by=',' idseq_dev taxon_child_parents}
  %x{cd /app/tmp/taxonomy; awk -F "\t" '{print x+=1,","$3","$1",2017-10-04,2017-10-04"}' categories.dmp | sed 's= ,=,=' > taxon_categories; mysqlimport --local --user=$DB_USERNAME --host=$RDS_ADDRESS --password=$DB_PASSWORD --fields-terminated-by=',' idseq_dev taxon_categories}
  ##

  Open3.capture3("rm -rf #{local_taxonomy_path}")
end
