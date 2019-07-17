S3_CARD_OWL = "s3://idseq-database/amr/aro.2019.07.09.owl".freeze
URL_PUBMED = "https://www.ncbi.nlm.nih.gov/pubmed/".freeze

class AmrHeatmapController < ApplicationController
  include PipelineOutputsHelper

  before_action :admin_required

  def index
    @sample_ids = params[:sampleIds].map(&:to_i)
  end

  # GET /amr_heatmap/amr_counts.json
  # Return JSON information about one or more samples' AMR counts, from submitted sample ids
  # A samples amr_counts is an array of objects describing genes & alleles that code for
  # antimicrobial resistance. Each object in amr_counts will look like:
  # {
  #   "id": 99999,
  #   "gene": "GENE-1_DrugClass",
  #   "allele": "GENE-7_777",
  #   "coverage": 12.345,
  #   "depth": 0.987,
  #   "pipeline_run_id": 11111,
  #   "drug_family": "Dru",
  #   "created_at": "2019-01-01T01:01:01.000-01:00",
  #   "updated_at": "2019-01-01T01:01:01.000-01:00"
  # },

  def amr_counts
    sample_ids = params[:sampleIds].map(&:to_i)
    samples = current_power.viewable_samples.where(id: sample_ids)
    good_sample_ids = {}
    amr_data = []

    samples.each do |sample|
      amr_counts = []
      pipeline_run = sample.first_pipeline_run
      if pipeline_run
        amr_state = pipeline_run.output_states.find_by(output: "amr_counts")
        if amr_state.present? && amr_state.state == PipelineRun::STATUS_LOADED
          amr_counts = pipeline_run.amr_counts
        end
      end
      amr_data << {
        "sampleName" => sample.name,
        "sampleId" => sample.id,
        "metadata" => sample.metadata_with_base_type,
        "amrCounts" => amr_counts,
        "error" => ""
      }
      good_sample_ids[sample.id] = true
    end

    sample_ids.each do |input_id|
      unless good_sample_ids.key?(input_id)
        amr_data << {
          "sampleName" => "",
          "sampleId" => input_id,
          "metadata" => {},
          "amrCounts" => [],
          "error" => "sample not found"
        }
      end
    end

    render json: amr_data
  end

  def fetch_card_info
    gene_name = params[:geneName]
    ontology = {
      "accession" => "",
      "label" => "",
      "synonyms" => [],
      "description" => "",
      "geneFamily" => [],
      "drugClass" => [],
      "publications" => [],
      "error" => ""
    }

    card_owl = fetch_card_owl()
    if card_owl.nil?
      ontology["error"] = "Unable to retrieve CARD ARO owl file."
      render(json: ontology) && return
    end
    ## Search the CARD OWL file
    raw_owl_xml = card_owl.force_encoding("utf-8")
    owl_doc = Nokogiri::XML(raw_owl_xml)
    search_result = search_card_owl(gene_name, owl_doc)
    unless search_result["error"].nil?
      ontology["error"] = search_result["error"]
      render(json: ontology) && return
    end

    ontology_info = gather_ontology_information(search_result["matching_node"], owl_doc)
    ontology_info.each do |key, value|
      ontology[key] = value
    end

    ontology["publications"] = ontology["publications"].map do |pubmed_string|
      get_publication_name(pubmed_string.split(":")[1])
    end

    render json: ontology
  end

  private

  def fetch_card_owl
    card_owl = Rails.cache.fetch('card_owl_file', expires_in: 30.days) do
      get_s3_file(S3_CARD_OWL)
    end
    return card_owl
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
end
