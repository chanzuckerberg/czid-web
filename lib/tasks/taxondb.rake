require 'open3'
require 'csv'
task load_taxon_db: :environment do
  t = TaxonDescription.new
  nodes_s3_file = "nodes.dmp"
  categories_s3_file = "categories.dmp"
  s3_taxonomy_path = "s3://czbiohub-infectious-disease/taxonomy"
  local_taxonomy_path = "/app/tmp/taxonomy"
  command = "mkdir -p #{local_taxonomy_path};"
  command += "aws s3 cp #{s3_taxonomy_path} #{local_taxonomy_path} --recursive;"
  Open3.capture3(command)
  nodes_file = "#{local_taxonomy_path}/#{nodes_s3_file}"
  nodes = CSV.read(nodes_file, col_sep: "\t|\t")
  nodes.each do |n|
    t.taxon_child_parents.build(taxid: n[0], parent_taxid: n[1], rank: n[2])
  end
  categories_file = "#{local_taxonomy_path}/#{categories_s3_file}"
  cats = CSV.read(categories_file, col_sep: "\t")
  cats.each do |c|
    t.taxon_categories.build(taxid: c[2], category: c[0])
  end
  t.save
end
