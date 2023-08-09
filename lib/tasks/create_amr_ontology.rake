# This task creates the ontology file used to:
# 1. populate the high level drug class field on the pipeline side
# 2. populate the gene details panel for AMR genes
# It should be run after the destination folder named with today's date has been created
# and aro_index.tsv file has been uploaded to the folder.
# See https://czi.atlassian.net/wiki/spaces/SCI/pages/2678292933/WebApp+AMR+V2
# for details on the AMR project.

# Entries in the final JSON file have the form
# {
#   name: {
#     label:
#     accession:
#     description:
#     synonyms: []
#     geneFamily: [{ label: description}]
#     dnaAccession:
#     proteinAccession:
#     parentAccessions: []
#     childrenAccessions: []
#     drugClass: []
#   }
# }

# the most up to date version of the ARO is always found here
MASTER_OWL_URI = "https://raw.githubusercontent.com/arpcard/aro/master/aro.owl".freeze

ACCESSION_REGEX = Regexp.new("ARO_[0-9]+")
ANTIBIOTIC_MOLECULE_ACCESSION = "1000003".freeze # parent entry for all high level drug classes
ANTIBIOTIC_MIXTURE_ACCESSION = "3000707".freeze # a drug class we want to filter out of the results

require "nokogiri"

desc "Create a reference ontology JSON file using the latest CARD data and upload to S3."
task :create_amr_ontology, [:destination_folder] => :environment do |_, args|
  destination_folder = args[:destination_folder]
  if destination_folder.blank?
    raise 'destination S3 folder (e.g. "2023-05-22") required'
  end

  puts("Starting to create CARD ontology for folder #{destination_folder}.")

  # load full XML ontology from latest OWL file
  owl_uri = URI(MASTER_OWL_URI)
  response = Net::HTTP.get_response(owl_uri)
  unless response.is_a?(Net::HTTPSuccess)
    Rails.logger.error("Unable to fetch OWL file")
    return
  end
  body = response.body.force_encoding("utf-8")

  owl_doc = Nokogiri::XML(body)

  card_info_by_gene_json = {}

  # Load TSV with additional info from S3.
  # This file only has entries for the gene level (not parent levels),
  # so use it as a reference for all genes.
  gene_level_tsv = S3Util.get_s3_file("s3://#{S3_DATABASE_BUCKET}/card/#{destination_folder}/aro_index.tsv")
  CSVSafe.parse(gene_level_tsv, col_sep: "\t", headers: true) do |row|
    gene_families = row["AMR Gene Family"].split(";").map do |gene_family|
      { "label" => gene_family }
    end
    card_info_by_gene = {
      "dnaAccession" => row["DNA Accession"],
      "proteinAccession" => row["Protein Accession"],
      "geneFamily" => gene_families,
      "drugClass" => row["Drug Class"],
    }
    accession = row["ARO Accession"].split(":")[1]
    card_info_by_gene_json[accession] = card_info_by_gene
  end

  # Parse XML doc into json to make it easier to traverse
  json_ontology = parse_xml_doc_to_json(owl_doc, card_info_by_gene_json)

  # At this point, the doc has only parent_accession fields
  # but it's easier to traverse if we also have pointers to an entry's
  # children, so construct the downwards associations too.
  create_child_associations(json_ontology)

  # Propagate high level drug class down to child nodes
  populate_high_level_drug_class(json_ontology)

  # Swap index from accession to gene name
  json_indexed_by_gene_name = format_json_ontology(json_ontology)

  # Populate the gene family field
  populate_gene_family_description(json_indexed_by_gene_name)

  # Upload to S3 public references folder
  S3_JSON_KEY = "card/#{destination_folder}/ontology.json".freeze
  S3Util.upload_to_s3(S3_DATABASE_BUCKET, S3_JSON_KEY, json_indexed_by_gene_name.to_json)

  puts("Finished uploading ontology JSON to #{S3_JSON_KEY}")
end

# parse XML to JSON to make document easier to traverse
def parse_xml_doc_to_json(owl_doc, card_ontology)
  owl_classes = owl_doc.xpath(".//owl:Class")
  json_doc = {}
  owl_classes.each do |owl_class|
    entry_ontology_information = gather_entry_information(owl_class)
    accession = entry_ontology_information["accession"]

    # merge in geneFamily, drugClass, genbank accessions
    corresponding_card_ontology_entry = card_ontology[accession]
    if corresponding_card_ontology_entry.present?
      entry_ontology_information = entry_ontology_information.merge(corresponding_card_ontology_entry)
    end
    json_doc[accession] = entry_ontology_information
  end
  json_doc
end

# parse XML class to find all subClassOf relationships and store their accession
def get_parent_classes(gene_entry)
  parent_classes = gene_entry.xpath("./rdfs:subClassOf")
  parent_class_accessions = []
  parent_classes.each do |parent_class|
    accession = ACCESSION_REGEX.match(parent_class.to_html).to_s.gsub("ARO_", "")
    parent_class_accessions << accession
  end
  parent_class_accessions
end

# populate entry for an accession by parsing XML
def gather_entry_information(matching_entry)
  ontology_information = {}
  # Gathering properties
  ontology_information["label"] = matching_entry.at_xpath("./rdfs:label")&.content
  ontology_information["accession"] = matching_entry.at_xpath("./oboInOwl:id")&.content&.split(':')&.[](1)
  ontology_information["description"] = matching_entry.at_xpath("./obo:IAO_0000115")&.content

  ontology_information["parentAccessions"] = get_parent_classes(matching_entry)
  ontology_information["childrenAccessions"] = []
  ontology_information["highLevelDrugClasses"] = []
  local_properties = {
    "synonyms" => matching_entry.xpath("./oboInOwl:hasExactSynonym"),
  }

  local_properties.each do |ontology_key, property_nodes|
    collection = []
    unless property_nodes.nil?
      property_nodes.each do |node|
        collection.push(node.content)
      end
    end
    ontology_information[ontology_key] = collection
  end
  return ontology_information
end

# Iterate over parent associations for a node and push
# the current entry's accession to the parent's children array.
def create_child_associations(json_ontology)
  json_ontology.each do |accession, entry|
    parent_accessions = entry["parentAccessions"]
    parent_accessions.each do |parent_accession|
      parent_entry = json_ontology[parent_accession]
      parent_entry["childrenAccessions"] << accession if parent_entry
    end
  end
  json_ontology
end

# Find the high level drug classes (~50, children of "antibiotic molecule entry")
# and for each of them, propagate the label down through their children's
# high level drug class field. This will be used by the AMR pipeline to look up high level drug class
# given a low level drug class.
def populate_high_level_drug_class(json_ontology)
  antibiotic_molecule_entry = json_ontology[ANTIBIOTIC_MOLECULE_ACCESSION]
  high_level_drug_class_accessions = antibiotic_molecule_entry["childrenAccessions"] - [ANTIBIOTIC_MIXTURE_ACCESSION]
  high_level_drug_class_accessions.each do |accession|
    entry = json_ontology[accession]
    drug_class_name = entry["label"]
    entry["highLevelDrugClasses"] = [drug_class_name] # each high level drug class's high level drug class is itself
    propagate_drug_class_to_children(drug_class_name, entry, json_ontology)
  end
  json_ontology
end

# Helper function to recurse through children and propagate high
# level drug class from parent to child.
def propagate_drug_class_to_children(drug_class_name, entry, json_ontology)
  children_accessions = entry["childrenAccessions"]
  children_accessions.each do |accession|
    child_entry = json_ontology[accession]
    if child_entry.nil?
      puts("missing entry for accession #{accession}")
    end
    drug_classes = child_entry["highLevelDrugClasses"]
    drug_classes << drug_class_name unless drug_classes.include?(drug_class_name)
    propagate_drug_class_to_children(drug_class_name, child_entry, json_ontology)
  end
end

# Swap key used for indexing from accession to gene name
# since this will be easier to use for indexing from pipeline
# and web app.
def format_json_ontology(json_ontology)
  json_ontology.transform_keys { |accession| json_ontology[accession]["label"] }
end

# For each entry, find the entry for its gene family and pull the description
def populate_gene_family_description(json_ontology)
  json_ontology.values.each do |entry_info|
    gene_families = entry_info["geneFamily"]
    if gene_families.present?
      gene_families.each do |gene_family|
        gene_family["description"] = json_ontology[gene_family["label"]]&.[]("description")
      end
    end
  end
  json_ontology
end

# unused but useful for debugging
def search_doc_by_accession(accession, owl_doc)
  owl_doc.at_xpath(".//owl:Class[@rdf:about='http://purl.obolibrary.org/obo/ARO_#{accession}']")
end
