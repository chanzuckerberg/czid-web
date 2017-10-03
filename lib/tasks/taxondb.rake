require 'open3'
require 'csv'
task load_taxon_db: :environment do
  t = TaxonDescription.create(version: 1)
  nodes_s3_file = "nodes.dmp"
  categories_s3_file = "categories.dmp"
  s3_taxonomy_path = "s3://czbiohub-infectious-disease/taxonomy"
  local_taxonomy_path = "/app/tmp/taxonomy"
  command = "mkdir -p #{local_taxonomy_path};"
  command += "aws s3 cp #{s3_taxonomy_path} #{local_taxonomy_path} --recursive;"
  Open3.capture3(command)
  nodes_file = "#{local_taxonomy_path}/#{nodes_s3_file}"
  f = CSV.open(nodes_file, "r", { :col_sep => "\t|\t" })
  f.each do |n|
    t.taxon_child_parents.create(taxid: n[0].to_i, parent_taxid: n[1].to_i, rank: n[2])
  end
  f.close()
  categories_file = "#{local_taxonomy_path}/#{categories_s3_file}"
  f = CSV.open(categories_file, "r", { :col_sep => "\t" })
  f.each do |c|
    t.taxon_categories.create(taxid: c[2].to_i, category: c[0])
  end
  f.close()
  t.save
end
