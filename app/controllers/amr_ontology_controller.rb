class AmrOntologyController < ApplicationController
  include S3Util

  S3_JSON_PREFIX = "card".freeze
  DEFAULT_CARD_VERSION = "2023-05-22".freeze

  def fetch_ontology
    gene_name = params[:geneName]
    ontology = {
      "accession" => "",
      "synonyms" => [],
      "description" => "",
      "geneFamily" => [],
      "dnaAccession" => nil,
      "proteinAccession" => nil,
      "error" => "",
    }
    ontology_json_key = fetch_current_ontology_file_key()
    card_entry = fetch_ontology_entry(ontology_json_key, gene_name)

    # For deprecated AMR pipeline, the first letter of the gene name may have been uppercased
    if card_entry.blank?
      gene_name = gene_name[0].downcase + gene_name[1..-1]
      card_entry = fetch_ontology_entry(ontology_json_key, gene_name)
    end

    if card_entry.key?("label") # present in every ontology entry
      card_entry.each do |property, description|
        ontology[property] = description
      end
      unless card_entry.key?("description")
        ontology["description"] = "No description available for #{gene_name}."
      end
    else
      ontology["error"] = "No data for #{gene_name}."
    end
    render json: ontology
  end

  private

  def fetch_current_ontology_file_key
    latest_ontology_version = get_app_config(AppConfig::CARD_VERSION_FOLDER, DEFAULT_CARD_VERSION)
    "#{S3_JSON_PREFIX}/#{latest_ontology_version}/ontology.json"
  end

  def fetch_ontology_entry(s3_key, gene_name)
    sql_expression = "SELECT * FROM S3Object[*].#{gene_name.dump} LIMIT 1"
    entry = S3Util.s3_select_json(S3_DATABASE_BUCKET, s3_key, sql_expression)
    trimmed_entry = entry.chomp(",")
    ontology = {}
    begin
      ontology = JSON.parse(trimmed_entry)
    rescue JSON::ParserError => e
      Rails.logger.error(e.message)
      return {}
    end
    return ontology
  end
end
