MASTER_OWL_URI = "https://raw.githubusercontent.com/arpcard/aro/master/aro.owl".freeze
URL_PUBMED = "https://www.ncbi.nlm.nih.gov/pubmed/".freeze
S3_JSON_BUCKET = "idseq-database".freeze
S3_ARGANNOT_FASTA = "s3://idseq-database/amr/ARGannot_r2.fasta".freeze
DEFAULT_S3_REGION = "us-west-2".freeze

require "aws-sdk-s3"
require "nokogiri"

desc 'Updates and precomputes AMR Ontology information'
task :precompute_gene_ontology => :environment do
  s3 = Aws::S3::Client.new(region: DEFAULT_S3_REGION)

  owl_uri = URI(MASTER_OWL_URI)
  response = Net::HTTP.get_response(owl_uri)
  unless response.is_a?(Net::HTTPSuccess)
    Rails.logger.error("Unable to fetch OWL file")
    return
  end
  owl_doc = Nokogiri::XML(response.body.force_encoding("utf-8"))

  arg_annot_fasta = nil
  split_uri = S3_ARGANNOT_FASTA.split("/", 4)
  bucket = split_uri[2]
  key = split_uri[3]
  begin
    resp = s3.get_object(bucket: bucket, key: key)
    arg_annot_fasta = resp.body.read
  rescue Aws::S3::Errors => err
    Rails.logger.error("Unable to fetch ARG ANNOT fasta file from S3")
    Rails.logger.error(err.message)
    return
  end

  split_lines = arg_annot_fasta.split("\n")
  arg_entries = []
  split_lines.each do |line|
    if line[0] == ">"
      split_entry = line.split(";")
      gene_name = split_entry[2]
      arg_entries.push(gene_name)
    end
  end

  json_ontology = {}
  arg_entries.each do |gene|
    Rails.logger.info("Building ontology for #{gene}")
    ontology = {}
    search_result = search_card_owl(gene, owl_doc)
    unless search_result["error"].nil?
      next
    end
    ontology_info = gather_ontology_information(search_result["matching_node"], owl_doc)
    ontology_info.each do |key, value|
      ontology[key] = value
    end
    ontology["publications"] = ontology["publications"].map do |pubmed_string|
      get_publication_name(pubmed_string.split(":")[1])
    end
    json_ontology[:gene] = ontology
  end

  time = Time.now()
  S3_JSON_KEY = "amr/#{time.year}-#{time.mon}-#{time.day}/aro.json".freeze
  begin
    s3_resp = s3.put_object({
      body: json_ontology.to_json,
      bucket: S3_JSON_BUCKET,
      key: S3_JSON_KEY
    })
  rescue Aws::S3::Errors => err
    Rails.logger.error("Failed to upload JSON ontology to S3")
    Rails.logger.error(err.message)
    return
  end

  Rails.logger.info("Finished building AMR gene ontology.")
end

def search_card_owl(gene_name, xml_dom)
  search_result = {}
  err = "No match found for %s in the CARD Antibiotic Resistance Ontology."
  owl_classes = xml_dom.xpath(".//owl:Class")
  matching_entry = nil

  # normalize gene name
  alphanumeric_gene_name = gene_name.downcase.gsub(/\W/, '')
  regex_for_gene = Regexp.new("\\b#{alphanumeric_gene_name}\\b")
  # search through owl classes
  owl_classes.each do |owl_class|
    # first we check the label
    label = owl_class.at_xpath("./rdfs:label").content
    separated_label = label.downcase.tr('/', ' ')
    alphanumeric_label = separated_label.gsub(/[^0-9a-z_\s]/, '')
    if regex_for_gene.match?(alphanumeric_label)
      matching_entry = owl_class
      break
    end

    # then we check the synonyms
    synonyms = owl_class.xpath("./oboInOwl:hasExactSynonym")
    synonyms.each do |synonym|
      separated_synonym = synonym.content.downcase.tr('/', ' ')
      alphanumeric_synonym = separated_synonym.gsub(/[^0-9a-z_\s]/, '')
      if regex_for_gene.match?(alphanumeric_synonym)
        matching_entry = owl_class
        break
      end
    end
  end

  # abort if no matching entry
  if matching_entry.nil?
    search_result["error"] = format(err, gene_name)
  else
    search_result["matching_node"] = matching_entry
  end

  return search_result
end


def gather_ontology_information(matching_entry, xml_dom)
  ontology_information = {}
  # Gathering properties
  ontology_information["label"] = matching_entry.at_xpath("./rdfs:label").content
  ontology_information["accession"] = matching_entry.at_xpath("./oboInOwl:id").content.split(':')[1]
  ontology_information["description"] = matching_entry.at_xpath("./obo:IAO_0000115").content

  # These properties are referred to by accession number in the matching OWL Class,
  # but their labels are located elsewhere in the document.
  remote_properties = {
    "drugClass" => get_drug_classes(ontology_information["accession"], xml_dom),
    "geneFamily" => matching_entry.xpath("./rdfs:subClassOf[not(*)]")
  }

  # Some drug resistances are only listed in the gene family entry
  if remote_properties["drugClass"].empty?
    drug_classes = []
    remote_properties["geneFamily"].each do |node|
      gene_family_accession = node.get_attribute("rdf:resource").split('_')[1]
      drug_classes.concat(get_drug_classes(gene_family_accession, xml_dom))
    end
    remote_properties["drugClass"] = drug_classes
  end

  local_properties = {
    "synonyms" => matching_entry.xpath("./oboInOwl:hasExactSynonym"),
    "publications" => matching_entry.at_xpath("./following-sibling::owl:Axiom").xpath("./oboInOwl:hasDbXref")
  }

  local_properties.each do |ontology_key, property_nodes|
    collection = []
    property_nodes.each do |node|
      collection.push(node.content)
    end
    ontology_information[ontology_key] = collection
  end

  remote_properties.each do |ontology_key, property_nodes|
    collection = []
    property_nodes.each do |node|
      accession = node.get_attribute("rdf:resource").split('_')[1]
      accession_class = xml_dom.at_xpath(".//owl:Class[@rdf:about='http://purl.obolibrary.org/obo/ARO_#{accession}']")
      label = accession_class.at_xpath("./rdfs:label").content
      description = accession_class.at_xpath("./obo:IAO_0000115").content
      entry = { "label" => label, "description" => description }
      collection.push(entry)
    end
    ontology_information[ontology_key] = collection
  end
  return ontology_information
end

def get_drug_classes(accession, xml_dom)
  accession_class = xml_dom.at_xpath(".//owl:Class[@rdf:about='http://purl.obolibrary.org/obo/ARO_#{accession}']")
  drug_class_node_markers = accession_class.xpath("./rdfs:subClassOf/owl:Restriction/owl:onProperty[@rdf:resource='http://purl.obolibrary.org/obo/RO#_confers_resistance_to_drug']")
  drug_class_family_node_markers = accession_class.xpath("./rdfs:subClassOf/owl:Restriction/owl:onProperty[@rdf:resource='http://purl.obolibrary.org/obo/RO#_confers_resistance_to']")
  drug_markers = drug_class_node_markers + drug_class_family_node_markers
  drug_class_nodes = []
  drug_markers.each do |node_marker|
    drug_class_nodes.push(node_marker.at_xpath("./following-sibling::owl:someValuesFrom"))
  end
  return drug_class_nodes
end

def get_publication_name(pmid)
  pubmed_uri = URI(URL_PUBMED + pmid)
  response = Net::HTTP.get_response(pubmed_uri)
  unless response.is_a?(Net::HTTPSuccess)
    return pmid
  end
  publication_page = Nokogiri::HTML(response.body)
  abstract_node = publication_page.at_xpath(".//div[@class='rprt abstract']")
  authors = abstract_node.at_xpath("./div[@class='auths']").content
  title = abstract_node.at_xpath("./h1").content
  pub_name = "#{authors} #{title} (PMID #{pmid})"
  return pub_name
end