MASTER_OWL_URI = "https://raw.githubusercontent.com/arpcard/aro/master/aro.owl".freeze
URL_PUBMED = "https://www.ncbi.nlm.nih.gov/pubmed/".freeze
S3_ARGANNOT_FASTA = "amr/ARGannot_r2.fasta".freeze

DRUG_CLASSES = {
  "agly" => ["Aminoglycosides", "0000016"],
  "bla" => ["Beta-lactamases", "3000001"],
  "colistin" => ["Colistins", "0000067"],
  # "fcd" => [], # Listed in ARG-ANNOT for Far1, but unclear what it refers to
  "fos" => ["Fosfomycin", "0000025"],
  "fcyn" => ["Fosfomycin", "0000025"],
  "flq" => ["Fluroquinolones", "0000001"],
  "gly" => ["Glycopeptides", "3000081"],
  "mls" => ["Macrolide-lincosamide-streptogramin", "0000000"],
  "ntmdz" => ["Nitroimidazoles", "3004115"],
  "oxzln" => ["Oxazolidinones", "3000079"],
  "phe" => ["Phenicols", "3000387"],
  "rif" => ["Rifampicin", "3000169"],
  "sul" => ["Sulfonamides", "3000282"],
  "tet" => ["Tetracyclines", "3000050"],
  "tmt" => ["Trimethoprim", "3000188"],
}.freeze # label, ARO Accession number

require "aws-sdk-s3"
require "nokogiri"

desc 'Updates and precomputes AMR Ontology information'
task precompute_gene_ontology: :environment do
  s3 = Aws::S3::Client.new(region: DEFAULT_S3_REGION)

  owl_uri = URI(MASTER_OWL_URI)
  response = Net::HTTP.get_response(owl_uri)
  unless response.is_a?(Net::HTTPSuccess)
    Rails.logger.error("Unable to fetch OWL file")
    return
  end
  owl_doc = Nokogiri::XML(response.body.force_encoding("utf-8"))

  arg_annot_fasta = nil
  begin
    resp = s3.get_object(bucket: S3_DATABASE_BUCKET, key: S3_ARGANNOT_FASTA)
    arg_annot_fasta = resp.body.read
  rescue Aws::S3::Errors::ServiceError => err
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
      annotation_drug_class = split_entry[3]
      drug_class = if DRUG_CLASSES.key?(annotation_drug_class.downcase)
                     DRUG_CLASSES[annotation_drug_class.downcase]
                   else
                     [annotation_drug_class, "error"]
                   end
      genbank_accession = split_entry[4]
      arg_entries << {
        "gene_name" => gene_name,
        "drug_class" => drug_class,
        "genbank_accession" => genbank_accession,
      }
    end
  end

  json_ontology = {}
  arg_entries.each do |entry|
    gene = entry["gene_name"]
    drug_class = entry["drug_class"]
    genbank_accession = entry["genbank_accession"]
    Rails.logger.info("Building ontology for #{gene}")
    ontology = {}
    search_result = search_card_owl(gene, owl_doc)
    if search_result["error"].nil?
      ontology_info = gather_ontology_information(search_result["matching_node"], owl_doc)
      ontology_info.each do |property, record|
        ontology[property] = record
      end
      ontology["publications"] = ontology["publications"].map do |pubmed_string|
        get_publication_name(pubmed_string.split(":")[1])
      end
    end
    if drug_class[1] != "error"
      ontology["drugClass"] = get_node_information(drug_class[1], owl_doc)
      ontology["drugClass"]["label"] = drug_class[0]
    else
      Rails.logger.info("No drug class mapping for #{drug_class[0]} belonging to #{gene}")
      ontology["drugClass"] = { "label" => drug_class[0], "description" => "No description" }
    end
    ontology["genbankAccession"] = genbank_accession
    json_ontology[gene] = ontology
  end

  S3_JSON_KEY = "amr/ontology/#{Time.zone.now().strftime('%Y-%m-%d')}/aro.json".freeze
  begin
    s3.put_object(
      body: json_ontology.to_json,
      bucket: S3_DATABASE_BUCKET,
      key: S3_JSON_KEY
    )
  rescue Aws::S3::Errors::ServiceError => err
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
    "geneFamily" => matching_entry.xpath("./rdfs:subClassOf[not(*)]"),
  }

  local_properties = {
    "synonyms" => matching_entry.xpath("./oboInOwl:hasExactSynonym"),
    "publications" => matching_entry.at_xpath("./following-sibling::owl:Axiom").xpath("./oboInOwl:hasDbXref"),
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
      entry = get_node_information(accession, xml_dom)
      collection.push(entry)
    end
    ontology_information[ontology_key] = collection
  end
  return ontology_information
end

def get_node_information(accession, xml_dom)
  accession_class = xml_dom.at_xpath(".//owl:Class[@rdf:about='http://purl.obolibrary.org/obo/ARO_#{accession}']")
  label = accession_class.at_xpath("./rdfs:label").content
  description = accession_class.at_xpath("./obo:IAO_0000115").content
  entry = { "label" => label, "description" => description }
  return entry
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
