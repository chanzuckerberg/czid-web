require 'rails_helper'

RSpec.describe AmrHeatmapController, type: :controller do
  create_users

  # Admin context
  context 'Admin user' do
    # create users
    before do
      sign_in @admin
    end

    describe "GET index" do
      it "assigns @sample_ids" do
        project = create(:project, users: [@admin, @joe])
        sample_one = create(:sample, project: project, pipeline_runs_data: [{
                              amr_counts_data: [{
                                gene: "IamA_Gene",
                              },],
                              job_status: PipelineRun::STATUS_CHECKED,
                              output_states_data: [{
                                output: "amr_counts",
                                state: PipelineRun::STATUS_LOADED,
                              },],
                            },])
        sample_two = create(:sample, project: project, pipeline_runs_data: [{
                              amr_counts_data: [{
                                gene: "AnoT_Her",
                              },],
                              job_status: PipelineRun::STATUS_CHECKED,
                              output_states_data: [{
                                output: "amr_counts",
                                state: PipelineRun::STATUS_LOADED,
                              },],
                            },])

        get :index, params: { sampleIds: [sample_one["id"], sample_two["id"]] }
        expect(assigns(:sample_ids)).to eq([sample_one["id"].to_i, sample_two["id"].to_i])
      end

      it "renders the index template" do
        project = create(:project, users: [@admin, @joe])
        sample_one = create(:sample, project: project, pipeline_runs_data: [{
                              amr_counts_data: [{
                                gene: "IamA_Gene",
                              },],
                              job_status: PipelineRun::STATUS_CHECKED,
                              output_states_data: [{
                                output: "amr_counts",
                                state: PipelineRun::STATUS_LOADED,
                              },],
                            },])
        sample_two = create(:sample, project: project, pipeline_runs_data: [{
                              amr_counts_data: [{
                                gene: "AnoT_Her",
                              },],
                              job_status: PipelineRun::STATUS_CHECKED,
                              output_states_data: [{
                                output: "amr_counts",
                                state: PipelineRun::STATUS_LOADED,
                              },],
                            },])

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
                              },],
                              job_status: PipelineRun::STATUS_CHECKED,
                              output_states_data: [{
                                output: "amr_counts",
                                state: PipelineRun::STATUS_LOADED,
                              },],
                            },],
                                     metadata_fields: { collection_location: "San Francisco, USA", sample_type: "Water" })
        sample_two = create(:sample, project: project, pipeline_runs_data: [{
                              amr_counts_data: [{
                                gene: "AnoT_Her",
                              },],
                              job_status: PipelineRun::STATUS_CHECKED,
                              output_states_data: [{
                                output: "amr_counts",
                                state: PipelineRun::STATUS_LOADED,
                              },],
                            },],
                                     metadata_fields: { collection_location: "Los Angeles, USA", sample_type: "Serum" })

        amr_counts_one = sample_one.first_pipeline_run.amr_counts[0] # Because we only have one AmrCount in amr_counts_data
        amr_counts_two = sample_two.first_pipeline_run.amr_counts[0]

        get :amr_counts, params: { sampleIds: [sample_one["id"], sample_two["id"]] }
        expect(response.content_type).to eq("application/json")
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
                                                 },])
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
                                                 },])
      end

      it "works even if a sample doesn't exist" do
        # Create a test sample (in a project, as required) that contains AMR data.
        project = create(:project, users: [@admin, @joe])
        sample_one = create(:sample, project: project, pipeline_runs_data: [{
                              amr_counts_data: [{
                                gene: "IamA_Gene",
                              },],
                              job_status: PipelineRun::STATUS_CHECKED,
                              output_states_data: [{
                                output: "amr_counts",
                                state: PipelineRun::STATUS_LOADED,
                              },],
                            },],
                                     metadata_fields: { collection_location: "Santa Barbara, USA", sample_type: "Blood" })

        amr_counts_one = sample_one.first_pipeline_run.amr_counts[0] # Because we only have one AmrCount in amr_counts_data

        get :amr_counts, params: { sampleIds: [sample_one["id"], 99_999] } # Sample ID 99999 should not exist
        expect(response.content_type).to eq("application/json")
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
                                                 },],
                                                 error: "")
        expect(json_response[1]).to include_json(sampleId: 99_999,
                                                 sampleName: "",
                                                 amrCounts: [],
                                                 error: "sample not found")
      end

      it "works even if a sample doesn't have amr counts" do
        # Create a test sample without AMR data.
        project = create(:project, users: [@admin, @joe])
        sample_one = create(:sample, project: project, pipeline_runs_data: [{
                              job_status: PipelineRun::STATUS_CHECKED,
                            },])

        get :amr_counts, params: { sampleIds: [sample_one["id"]] }
        expect(response.content_type).to eq("application/json")
        expect(response).to have_http_status(:ok)

        # Compare controller output to our test sample.
        json_response = JSON.parse(response.body)
        expect(json_response[0]).to include_json(sampleId: sample_one["id"],
                                                 sampleName: sample_one["name"],
                                                 amrCounts: [],
                                                 error: "")
      end
    end

    describe "GET CARD entry information" do
      it "should return relevant information from the CARD Ontology database" do
        get :fetch_ontology, params: { geneName: "OqxB" }
        expect(response.content_type).to eq("application/json")
        expect(response).to have_http_status(:ok)

        json_response = JSON.parse(response.body)
        expect(json_response).to include_json(
          label: "oqxB",
          accession: "3003923",
          description: "RND efflux pump conferring resistance to fluoroquinolone",
          synonyms: [

          ],
          publications: [
            "Kim HB1, Wang M, Park CH, Kim EC, Jacoby GA, Hooper DC. oqxAB encoding a multidrug efflux pump in human clinical isolates of Enterobacteriaceae. (PMID 19528276)",
          ],
          geneFamily: [
            {
              label: "subunit of efflux pump conferring antibiotic resistance",
              description: "Subunits of efflux proteins that pump antibiotic out of a cell to confer resistance.",
            },
          ],
          drugClass: {
            label: "Fluroquinolones",
            description: "The fluoroquinolones are a family of synthetic broad-spectrum antibiotics that are 4-quinolone-3-carboxylates. These compounds interact with topoisomerase II (DNA gyrase) to disrupt bacterial DNA replication, damage DNA, and cause cell death.",
          },
          error: ""
        )
      end

      it "should return an ontology object with an error message if no match is found" do
        get :fetch_ontology, params: { geneName: "ImNotInCard" }
        expect(response.content_type).to eq("application/json")
        expect(response).to have_http_status(:ok)

        json_response = JSON.parse(response.body)
        expect(json_response).to include_json(
          error: "No data for ImNotInCard."
        )
      end
    end
  end

  # Regular Joe context
  # Ensure that this feature cannot be accessed by non-admin users
  # TODO: Add a test case where the user tries to access a sample that they don't have access to.
  context 'Joe' do
    before do
      sign_in @joe
    end

    describe "GET json" do
      it "should not see any AMR information" do
        # As above
        project = create(:project, users: [@admin, @joe])
        sample = create(:sample, project: project, pipeline_runs_data: [{
                          amr_counts_data: [{
                            gene: "IamA_Gene",
                          },],
                          job_status: PipelineRun::STATUS_CHECKED,
                          output_states_data: [{
                            output: "amr_counts",
                            state: PipelineRun::STATUS_LOADED,
                          },],
                        },])

        get :amr_counts, params: { id: [sample["id"]] }
        expect(response).to redirect_to("/")
      end
    end
  end
end
