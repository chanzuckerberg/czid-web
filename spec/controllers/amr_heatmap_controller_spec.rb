require 'rails_helper'
require 'webmock/rspec'

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
  end
end
