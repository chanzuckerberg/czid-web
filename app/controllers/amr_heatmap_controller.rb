URL_PUBMED = "https://www.ncbi.nlm.nih.gov/pubmed/".freeze
S3_JSON_BUCKET = "idseq-database".freeze
S3_JSON_PREFIX = "amr/ontology/".freeze

class AmrHeatmapController < ApplicationController
  include S3Util

  before_action do
    allowed_feature_required("amr_heatmap", true)
  end

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
        "error" => "",
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
          "error" => "sample not found",
        }
      end
    end

    render json: amr_data
  end

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
    if card_entry.key?("label")
      card_entry.each do |property, description|
        ontology[property] = description
      end
    else
      ontology["error"] = "No data for #{gene_name}."
    end
    render json: ontology
  end

  private

  def fetch_current_ontology_file_key
    ontology_folder = S3_CLIENT.list_objects_v2(bucket: S3_JSON_BUCKET,
                                                prefix: S3_JSON_PREFIX).to_h
    # each time the rake task is run the json file is put in a folder
    # amr/ontology/YYYY-MM-DD/aro.json, so the latest run of the rake task
    # will be the last key listed here.
    target_key = ontology_folder[:contents][-1][:key] # contents already sorted by key
    return target_key
  end

  def fetch_ontology_entry(s3_key, gene_name)
    sql_expression = "SELECT * FROM S3Object[*].#{gene_name.dump} LIMIT 1"
    entry = S3Util.s3_select_json(S3_JSON_BUCKET, s3_key, sql_expression)
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
