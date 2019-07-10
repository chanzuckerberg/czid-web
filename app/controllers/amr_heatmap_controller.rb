URL_CARD_ARO = "filler_url".freeze
S3_CARD_OWL = "filler_s3".freeze

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
        sample_name: sample.name,
        sample_id: sample.id,
        amr_counts: amr_counts,
        error: ""
      }
      good_sample_ids[sample.id] = true
    end

    sample_ids.each do |input_id|
      unless good_sample_ids.key?(input_id)
        amr_data << {
          sample_name: "",
          sample_id: input_id,
          amr_counts: [],
          error: "sample not found"
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
      "synonyms" => "",
      "description" => "",
      "geneFamily" => "",
      "drugClass" => "",
      "resistanceMechanism" => "",
      "publications" => [],
      "error" => ""
    }

    card_owl = get_s3_file(S3_CARD_OWL)
    if card_owl.nil?
      ontology["error"] = "Unable to retrieve CARD ARO owl file."
      render json: ontology
      return
    end

    ## Search the CARD OWL file
    raw_owl_xml = card_owl.force_encoding("utf-8")
    search_result = search_card_owl(gene_name, raw_owl_xml)
    unless search_result["error"].nil?
      ontology["error"] = search_result["error"]
      render json: ontology
      return
    end

    search_result.each do |key, value|
      ontology[key] = value
    end

    ## Get info from the ARO entry
    card_aro_uri = URI(URL_CARD_ARO + ontology["accession"])

    aro_response = Net::HTTP.get_response(card_aro_uri)
    unless aro_response.is_a?(Net::HTTPSuccess)
      ontology["error"] = "Unable to access ARO entry from CARD website."
      render json: ontology
      return
    end

    parsed_aro_info = parse_aro_entry(aro_response.body)
    parsed_aro_info.each do |key, value|
      ontology[key] = value
    end

    render json: ontology
  end

  private

  def search_card_owl(gene_name, xml)
    search_result = {}

    owl_doc = Nokogiri::XML(xml)
    owl_classes = owl_doc.xpath(".//owl:Class")
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
      search_result["error"] = "No match found for #{gene_name} in the CARD Antibiotic Resistance Ontology."
      return search_result
    end

    search_result["label"] = matching_entry.at_xpath("./rdfs:label").content
    search_result["accession"] = matching_entry.at_xpath("./oboInOwl:id").content.split(':')[1]
    search_result["description"] = matching_entry.at_xpath("./obo:IAO_0000115").content
    return search_result
  end

  def parse_aro_entry(html)
    parsed_info = {}
    aro_doc = Nokogiri::HTML(html)
    aro_table = aro_doc.at_xpath(".//table[@vocab='http://dev.arpcard.mcmaster.ca/browse/data']/tbody")
    synonyms = aro_table.at_xpath("./tr/td[text()='Synonym(s)']/following-sibling::td")
    unless synonyms.nil?
      parsed_info["synonyms"] = synonyms.content
    end
    gene_family = aro_table.at_xpath("./tr/td[text()='AMR Gene Family']/following-sibling::td")
    unless gene_family.nil?
      parsed_info["geneFamily"] = gene_family.content
    end
    drug_class = aro_table.at_xpath("./tr/td[text()='Drug Class']/following-sibling::td")
    unless drug_class.nil?
      parsed_info["drugClass"] = drug_class.content
    end
    resistance_mechanism = aro_table.at_xpath("./tr/td[text()='Resistance Mechanism']/following-sibling::td")
    unless resistance_mechanism.nil?
      parsed_info["resistanceMechanism"] = resistance_mechanism.content
    end

    publications = []
    pub_list = aro_table.at_xpath("./tr/td[text()='Publications']/following-sibling::td")
    unless pub_list.nil?
      pub_list.xpath("./p").each do |publication|
        publications.push(publication.content)
      end
    end
    parsed_info["publications"] = publications
    return parsed_info
  end
end
