URL_PUBMED = "https://www.ncbi.nlm.nih.gov/pubmed/".freeze
S3_JSON_BUCKET = "idseq-database".freeze
S3_JSON_PREFIX = "amr/ontology/".freeze
DEFAULT_S3_REGION = "us-west-2".freeze

class AmrHeatmapController < ApplicationController
  before_action :admin_required
  before_action :set_aws_client, only: [:fetch_card_info]

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

  def fetch_card_info
    gene_name = params[:geneName]
    ontology = {}

    ontology_json_key = fetch_current_ontology_file_key()
    card_entry = fetch_ontology(ontology_json_key, gene_name)
    if card_entry.key?("label")
      ontology = card_entry
      ontology["error"] = ""
    else
      ontology["error"] = "No data for #{gene_name}."
    end
    render json: ontology
  end

  private

  def set_aws_client
    @client = Aws::S3::Client.new(region: DEFAULT_S3_REGION)
  end

  def fetch_current_ontology_file_key
    ontology_folder = @client.list_objects_v2(bucket: S3_JSON_BUCKET,
                                              prefix: S3_JSON_PREFIX).to_h
    target_key = ontology_folder[:contents][-1][:key] # contents already sorted by key
    return target_key
  end

  def fetch_ontology(s3_key, gene_name)
    s3_select_params = {
      bucket: S3_JSON_BUCKET,
      key: s3_key,
      expression_type: "SQL",
      expression: "SELECT * FROM S3Object[*].#{gene_name} LIMIT 1",
      input_serialization: {
        json: {
          type: "DOCUMENT",
        },
      },
      output_serialization: {
        json: {},
      },
    }

    entry = []
    begin
      @client.select_object_content(s3_select_params) do |stream|
        stream.on_records_event do |event|
          entry.push(event.payload.read)
        end
      end
    rescue
      Rails.logger.info("Error retrieving ontology entry for #{gene_name} from s3")
      return {}
    end
    whole_entry = entry.join
    ontology = {}
    begin
      ontology = JSON.parse(whole_entry)
    rescue JSON::ParserError => e
      Rails.logger.info(e.message)
      return {}
    end
    return ontology
  end
end
