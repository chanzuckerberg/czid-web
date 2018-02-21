require 'open3'
require 'csv'
require 'English'
task load_lineage_db: :environment do
  local_taxonomy_path = "/app/tmp/taxonomy"
  host = Rails.env == 'development' ? 'db' : '$RDS_ADDRESS'
  `
   mysql -h #{host} -u $DB_USERNAME --password=$DB_PASSWORD -e "SELECT * FROM idseq_#{Rails.env}.taxon_lineages;" | tr "\t" "," > #{local_taxonomy_path}/taxon_lineages.csv
   rm -rf #{local_taxonomy_path};
  `
  raise "lineage database import failed" unless $CHILD_STATUS.success?
end
