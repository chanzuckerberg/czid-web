URL_PUBMED = "https://www.ncbi.nlm.nih.gov/pubmed/".freeze
S3_JSON_PREFIX = "amr/card-ontology/".freeze

class AmrOntologyController < ApplicationController
  include S3Util

  def fetch_ontology
    gene_name = params[:geneName]
    ontology = {
      "accession" => "",
      "label" => "",
      "synonyms" => [],
      "description" => "",
      "geneFamily" => [],
      "drugClass" => {},
      "publications" => [],
      "error" => "",
    }
    ontology_json_key = fetch_current_ontology_file_key()
    card_entry = fetch_ontology_entry(ontology_json_key, gene_name)
    if card_entry.key?("drugClass") # present in every ontology entry
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
    ontology_folder = S3_CLIENT.list_objects_v2(bucket: S3_DATABASE_BUCKET,
                                                prefix: S3_JSON_PREFIX).to_h
    # each time the rake task is run the json file is put in a folder
    # amr/ontology/YYYY-MM-DD/aro.json, so the latest run of the rake task
    # will be the last key listed here.
    target_key = ontology_folder[:contents][-1][:key] # contents already sorted by key
    return target_key
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
