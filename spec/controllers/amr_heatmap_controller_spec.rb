require 'rails_helper'
require 'webmock/rspec'

ONTOLOGY_BUILD_DATE = "2019-06-20".freeze

OQXB_LABEL = "oqxB".freeze
OQXB_ACCESSION = "3003923".freeze
OQXB_DESCRIPTION = "RND efflux pump conferring resistance to fluoroquinolone".freeze
OQXB_GENE_FAMILY_LABEL = "subunit of efflux pump conferring antibiotic resistance".freeze
OQXB_GENE_FAMILY_DESC = "Subunits of efflux proteins that pump antibiotic out of a cell to confer resistance.".freeze
OQXB_DRUG_CLASS_LABEL = "Fluroquinolones".freeze
OQXB_DRUG_CLASS_DESC = "The fluoroquinolones are a family of synthetic broad-spectrum antibiotics that are 4-quinolone-3-carboxylates. These compounds interact with topoisomerase II (DNA gyrase) to disrupt bacterial DNA replication, damage DNA, and cause cell death.".freeze
OQXB_PUBLICATION = "Kim HB1, Wang M, Park CH, Kim EC, Jacoby GA, Hooper DC. oqxAB encoding a multidrug efflux pump in human clinical isolates of Enterobacteriaceae. (PMID 19528276)".freeze
OQXB_GENBANK_ACCESSION = "EU370913".freeze

OQXB_ONTOLOGY = {
  "accession" => OQXB_ACCESSION,
  "label" => OQXB_LABEL,
  "synonyms" => [],
  "description" => OQXB_DESCRIPTION,
  "geneFamily" => [
    {
      "label" => OQXB_GENE_FAMILY_LABEL,
      "description" => OQXB_GENE_FAMILY_DESC,
    },
  ],
  "drugClass" => {
    "label" => OQXB_DRUG_CLASS_LABEL,
    "description" => OQXB_DRUG_CLASS_DESC,
  },
  "publications" => [
    OQXB_PUBLICATION,
  ],
  "genbankAccession" => OQXB_GENBANK_ACCESSION,
  "error" => "",
}.freeze

RSpec.describe AmrHeatmapController, type: :controller do
  create_users

  # Regular Joe context
  context 'Joe' do
    # create users
    before do
      sign_in @joe
    end

    describe "GET index" do
      it "assigns @sample_ids" do
        project = create(:project, users: [@admin, @joe])
        sample_one = create(:sample, project: project, pipeline_runs_data: [{
                              amr_counts_data: [{
                                gene: "IamA_Gene",
                              }],
                              job_status: PipelineRun::STATUS_CHECKED,
                              output_states_data: [{
                                output: "amr_counts",
                                state: PipelineRun::STATUS_LOADED,
                              }],
                            }])
        sample_two = create(:sample, project: project, pipeline_runs_data: [{
                              amr_counts_data: [{
                                gene: "AnoT_Her",
                              }],
                              job_status: PipelineRun::STATUS_CHECKED,
                              output_states_data: [{
                                output: "amr_counts",
                                state: PipelineRun::STATUS_LOADED,
                              }],
                            }])

        get :index, params: { sampleIds: [sample_one["id"], sample_two["id"]] }
        expect(assigns(:sample_ids)).to eq([sample_one["id"].to_i, sample_two["id"].to_i])
      end

      it "renders the index template" do
        project = create(:project, users: [@admin, @joe])
        sample_one = create(:sample, project: project, pipeline_runs_data: [{
                              amr_counts_data: [{
                                gene: "IamA_Gene",
                              }],
                              job_status: PipelineRun::STATUS_CHECKED,
                              output_states_data: [{
                                output: "amr_counts",
                                state: PipelineRun::STATUS_LOADED,
                              }],
                            }])
        sample_two = create(:sample, project: project, pipeline_runs_data: [{
                              amr_counts_data: [{
                                gene: "AnoT_Her",
                              }],
                              job_status: PipelineRun::STATUS_CHECKED,
                              output_states_data: [{
                                output: "amr_counts",
                                state: PipelineRun::STATUS_LOADED,
                              }],
                            }])

        get :index, params: { sampleIds: [sample_one["id"], sample_two["id"]] }
        expect(response).to render_template("index")
      end
    end

    describe "GET json" do
      it "sees correct AMR data from multiple samples" do
        # Create a test sample (in a project, as required) that contains Amr data.
        # Note that pipeline_runs_data needs to have two attributes in order for the sample
        # to be available for the AmrHeatmapController: a job_status equal to the constant
        # STATUS_CHECKED as defined in the PipelineRun class, and an output_states array
        # containing an OutputState for amr_counts with state equal to the constant
        # STATUS_LOADED as defined in the PipelineRun class.
        project = create(:project, users: [@admin, @joe])
        sample_one = create(:sample, project: project, pipeline_runs_data: [{
                              amr_counts_data: [{
                                gene: "IamA_Gene",
                              }],
                              job_status: PipelineRun::STATUS_CHECKED,
                              output_states_data: [{
                                output: "amr_counts",
                                state: PipelineRun::STATUS_LOADED,
                              }],
                            }],
                                     metadata_fields: { collection_location: "San Francisco, USA", sample_type: "Water" })
        sample_two = create(:sample, project: project, pipeline_runs_data: [{
                              amr_counts_data: [{
                                gene: "AnoT_Her",
                              }],
                              job_status: PipelineRun::STATUS_CHECKED,
                              output_states_data: [{
                                output: "amr_counts",
                                state: PipelineRun::STATUS_LOADED,
                              }],
                            }],
                                     metadata_fields: { collection_location: "Los Angeles, USA", sample_type: "Serum" })

        amr_counts_one = sample_one.first_pipeline_run.amr_counts[0] # Because we only have one AmrCount in amr_counts_data
        amr_counts_two = sample_two.first_pipeline_run.amr_counts[0]

        get :amr_counts, params: { sampleIds: [sample_one["id"], sample_two["id"]] }
        expect(response.content_type).to include("application/json")
        expect(response).to have_http_status(:ok)

        # Compare controller output to our test sample.
        # The created_at and updated_at fields seem to differ in format (though not content)
        # when this is run, so they are left them out of the comparison.
        json_response = JSON.parse(response.body)
        expect(json_response[0]).to include_json(sampleId: sample_one["id"],
                                                 sampleName: sample_one["name"],
                                                 metadata: [{
                                                   key: "collection_location",
                                                   raw_value: "San Francisco, USA",
                                                   string_validated_value: "San Francisco, USA",
                                                   base_type: "string",
                                                 }, {
                                                   key: "sample_type",
                                                   raw_value: "Water",
                                                   string_validated_value: "Water",
                                                   base_type: "string",
                                                 },],
                                                 amrCounts: [{
                                                   id: amr_counts_one["id"],
                                                   gene: amr_counts_one["gene"],
                                                   allele: amr_counts_one["allele"],
                                                   coverage: amr_counts_one["coverage"],
                                                   depth: amr_counts_one["depth"],
                                                   pipeline_run_id: amr_counts_one["pipeline_run_id"],
                                                   drug_family: amr_counts_one["drug_family"],
                                                 }])
        expect(json_response[1]).to include_json(sampleId: sample_two["id"],
                                                 sampleName: sample_two["name"],
                                                 metadata: [{
                                                   key: "collection_location",
                                                   raw_value: "Los Angeles, USA",
                                                   string_validated_value: "Los Angeles, USA",
                                                   base_type: "string",
                                                 }, {
                                                   key: "sample_type",
                                                   raw_value: "Serum",
                                                   string_validated_value: "Serum",
                                                   base_type: "string",
                                                 },],
                                                 amrCounts: [{
                                                   id: amr_counts_two["id"],
                                                   gene: amr_counts_two["gene"],
                                                   allele: amr_counts_two["allele"],
                                                   coverage: amr_counts_two["coverage"],
                                                   depth: amr_counts_two["depth"],
                                                   pipeline_run_id: amr_counts_two["pipeline_run_id"],
                                                   drug_family: amr_counts_two["drug_family"],
                                                 }])
      end

      it "works even if a sample doesn't exist" do
        # Create a test sample (in a project, as required) that contains AMR data.
        project = create(:project, users: [@admin, @joe])
        sample_one = create(:sample, project: project, pipeline_runs_data: [{
                              amr_counts_data: [{
                                gene: "IamA_Gene",
                              }],
                              job_status: PipelineRun::STATUS_CHECKED,
                              output_states_data: [{
                                output: "amr_counts",
                                state: PipelineRun::STATUS_LOADED,
                              }],
                            }],
                                     metadata_fields: { collection_location: "Santa Barbara, USA", sample_type: "Blood" })

        amr_counts_one = sample_one.first_pipeline_run.amr_counts[0] # Because we only have one AmrCount in amr_counts_data

        get :amr_counts, params: { sampleIds: [sample_one["id"], 99_999] } # Sample ID 99999 should not exist
        expect(response.content_type).to include("application/json")
        expect(response).to have_http_status(:ok)

        # Compare controller output to our test sample.
        # The created_at and updated_at fields seem to differ in format (though not content)
        # when this is run, so they are left them out of the comparison.
        json_response = JSON.parse(response.body)
        expect(json_response[0]).to include_json(sampleId: sample_one["id"],
                                                 sampleName: sample_one["name"],
                                                 metadata: [{
                                                   key: "collection_location",
                                                   raw_value: "Santa Barbara, USA",
                                                   string_validated_value: "Santa Barbara, USA",
                                                   base_type: "string",
                                                 }, {
                                                   key: "sample_type",
                                                   raw_value: "Blood",
                                                   string_validated_value: "Blood",
                                                   base_type: "string",
                                                 },],
                                                 amrCounts: [{
                                                   id: amr_counts_one["id"],
                                                   gene: amr_counts_one["gene"],
                                                   allele: amr_counts_one["allele"],
                                                   coverage: amr_counts_one["coverage"],
                                                   depth: amr_counts_one["depth"],
                                                   pipeline_run_id: amr_counts_one["pipeline_run_id"],
                                                   drug_family: amr_counts_one["drug_family"],
                                                 }],
                                                 error: "")
        expect(json_response[1]).to include_json(sampleId: 99_999,
                                                 sampleName: "",
                                                 amrCounts: [],
                                                 error: "sample not found")
      end

      it "works properly if user tries to access sample they don't have access to" do
        # Create a test sample (in a project, as required) that contains AMR data.
        project_joe = create(:project, users: [@joe])
        project_admin = create(:project, users: [@admin])
        sample_joe = create(:sample, project: project_joe, pipeline_runs_data: [{
                              amr_counts_data: [{
                                gene: "IamA_Gene",
                              }],
                              job_status: PipelineRun::STATUS_CHECKED,
                              output_states_data: [{
                                output: "amr_counts",
                                state: PipelineRun::STATUS_LOADED,
                              }],
                            }],
                                     metadata_fields: { collection_location: "Santa Barbara, USA", sample_type: "Blood" })

        sample_admin = create(:sample, project: project_admin, pipeline_runs_data: [{
                                amr_counts_data: [{
                                  gene: "AnoT_Her",
                                }],
                                job_status: PipelineRun::STATUS_CHECKED,
                                output_states_data: [{
                                  output: "amr_counts",
                                  state: PipelineRun::STATUS_LOADED,
                                }],
                              }],
                                       metadata_fields: { collection_location: "Los Angeles, USA", sample_type: "Serum" })

        amr_counts_joe = sample_joe.first_pipeline_run.amr_counts[0] # Because we only have one AmrCount in amr_counts_data

        get :amr_counts, params: { sampleIds: [sample_joe["id"], sample_admin["id"]] } # Joe shouldn't be able to access sample_admin
        expect(response.content_type).to include("application/json")
        expect(response).to have_http_status(:ok)

        # Compare controller output to our test sample.
        # The created_at and updated_at fields seem to differ in format (though not content)
        # when this is run, so they are left them out of the comparison.
        json_response = JSON.parse(response.body)
        expect(json_response[0]).to include_json(sampleId: sample_joe["id"],
                                                 sampleName: sample_joe["name"],
                                                 metadata: [{
                                                   key: "collection_location",
                                                   raw_value: "Santa Barbara, USA",
                                                   string_validated_value: "Santa Barbara, USA",
                                                   base_type: "string",
                                                 }, {
                                                   key: "sample_type",
                                                   raw_value: "Blood",
                                                   string_validated_value: "Blood",
                                                   base_type: "string",
                                                 },],
                                                 amrCounts: [{
                                                   id: amr_counts_joe["id"],
                                                   gene: amr_counts_joe["gene"],
                                                   allele: amr_counts_joe["allele"],
                                                   coverage: amr_counts_joe["coverage"],
                                                   depth: amr_counts_joe["depth"],
                                                   pipeline_run_id: amr_counts_joe["pipeline_run_id"],
                                                   drug_family: amr_counts_joe["drug_family"],
                                                 }],
                                                 error: "")
        expect(json_response[1]).to include_json(sampleId: sample_admin["id"],
                                                 sampleName: "",
                                                 amrCounts: [],
                                                 error: "sample not found")
      end

      it "works even if a sample doesn't have amr counts" do
        # Create a test sample without AMR data.
        project = create(:project, users: [@admin, @joe])
        sample_one = create(:sample, project: project, pipeline_runs_data: [{
                              job_status: PipelineRun::STATUS_CHECKED,
                            }])

        get :amr_counts, params: { sampleIds: [sample_one["id"]] }
        expect(response.content_type).to include("application/json")
        expect(response).to have_http_status(:ok)

        # Compare controller output to our test sample.
        json_response = JSON.parse(response.body)
        expect(json_response[0]).to include_json(sampleId: sample_one["id"],
                                                 sampleName: sample_one["name"],
                                                 amrCounts: [],
                                                 error: "")
      end
    end

    describe "GET ontology information" do
      before do
        s3 = Aws::S3::Client.new(stub_responses: true)
        s3.stub_responses(:list_objects_v2, lambda { |context|
          return {
            is_truncated: false,
            contents: [
              {
                key: "amr/ontology/#{ONTOLOGY_BUILD_DATE}/aro.json",
                last_modified: Time.new(2019, 0o6, 20, 18, 30, 0, "-07:00"),
                etag: "\"d70a48922d199eb2dd1ea1186c8998df\"",
                size: 2_820_541,
                storage_class: "STANDARD",
              },
            ],
            name: context.params[:bucket].to_s,
            prefix: context.params[:prefix].to_s,
            max_keys: 1000,
            key_count: 1,
          }
        })
        stub_const("S3_CLIENT", s3)
      end
      context "when a matching gene name is found" do
        before do
          # The comma is added to emulate the JSON delimiter between entries.
          # Although in this instance we are only returning one entry,
          # S3 always adds the comma at the end.
          allow(S3Util).to receive(:s3_select_json).and_return(OQXB_ONTOLOGY.to_json + ",")
          stub_const("S3_DATABASE_BUCKET", "czid-public-references")
        end

        it "should return relevant information from the Ontology JSON stored on s3" do
          get :fetch_ontology, params: { geneName: "OqxB" }
          expect(response.content_type).to include("application/json")
          expect(response).to have_http_status(:ok)
          json_response = JSON.parse(response.body)
          expect(json_response).to include_json(
            label: OQXB_LABEL,
            accession: OQXB_ACCESSION,
            description: OQXB_DESCRIPTION,
            synonyms: [],
            publications: [
              OQXB_PUBLICATION,
            ],
            geneFamily: [
              {
                label: OQXB_GENE_FAMILY_LABEL,
                description: OQXB_GENE_FAMILY_DESC,
              },
            ],
            drugClass: {
              label: OQXB_DRUG_CLASS_LABEL,
              description: OQXB_DRUG_CLASS_DESC,
            },
            error: ""
          )
        end
      end

      context "when no matching gene is found" do
        before do
          allow(S3Util).to receive(:s3_select_json).and_return("")
          stub_const("S3_DATABASE_BUCKET", "czid-public-references")
        end

        it "should return an ontology object with an error message if no match is found" do
          get :fetch_ontology, params: { geneName: "ImNotInCard" }
          expect(response.content_type).to include("application/json")
          expect(response).to have_http_status(:ok)

          json_response = JSON.parse(response.body)
          expect(json_response).to include_json(
            error: "No data for ImNotInCard."
          )
        end
      end
    end
  end
end
