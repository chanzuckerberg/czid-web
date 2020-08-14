require 'rails_helper'

RSpec.describe SnapshotSamplesController, type: :controller do
  before do
    user = create(:user)
    project = create(:project, users: [user])
    @sample_one = create(:sample,
                         project: project,
                         pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED }])
    @sample_two = create(:sample,
                         project: project,
                         pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED }])
    @snapshot_link = create(:snapshot_link,
                            project_id: project.id,
                            share_id: "test_id",
                            content: { samples: [{ @sample_one.id => { pipeline_run_id: @sample_one.first_pipeline_run.id } }] }.to_json)
    @empty_snapshot_link = create(:snapshot_link,
                                  project_id: project.id,
                                  share_id: "empty_id",
                                  content: { samples: [] }.to_json)
  end

  context "when snapshot sharing is disabled" do
    before do
      AppConfigHelper.set_app_config(AppConfig::ENABLE_SNAPSHOT_SHARING, "0")
    end

    describe "GET #show" do
      it "should redirect to root_path" do
        get :show, params: { id: @sample_one.id, share_id: @snapshot_link.share_id }
        expect(response).to redirect_to(root_path)
      end
    end

    describe "GET #report_v2" do
      it "should redirect to root_path" do
        get :report_v2, params: { id: @sample_one.id, share_id: @snapshot_link.share_id }
        expect(response).to redirect_to(root_path)
      end
    end

    describe "GET #index_v2" do
      it "should redirect to root_path" do
        get :index_v2, params: { share_id: @snapshot_link.share_id, project_id: @snapshot_link.project_id, listAllIds: true, basic: true }
        expect(response).to redirect_to(root_path)
      end
    end

    describe "GET #sample_locations" do
      it "should redirect to root_path" do
        get :sample_locations, params: { share_id: @snapshot_link.share_id, domain: "snapshot", project_id: @snapshot_link.project_id }
        expect(response).to redirect_to(root_path)
      end
    end

    describe "GET #stats" do
      it "should redirect to root_path" do
        get :stats, params: { share_id: @snapshot_link.share_id, domain: "snapshot", project_id: @snapshot_link.project_id }
        expect(response).to redirect_to(root_path)
      end
    end

    describe "GET #dimensions" do
      it "should redirect to root_path" do
        get :dimensions, params: { share_id: @snapshot_link.share_id, domain: "snapshot", project_id: @snapshot_link.project_id }
        expect(response).to redirect_to(root_path)
      end
    end
  end

  context "when snapshot sharing is enabled" do
    before do
      AppConfigHelper.set_app_config(AppConfig::ENABLE_SNAPSHOT_SHARING, "1")
      @public_background = create(:background, name: "Public Background", public_access: 1, pipeline_run_ids: [
                                    @sample_one.first_pipeline_run.id,
                                    @sample_two.first_pipeline_run.id,
                                  ])
      @location_metadata_field = create(:metadata_field, name: "collection_location", base_type: 0)
      @location_v2_metadata_field = create(:metadata_field, name: "collection_location_v2", base_type: 3)
      @sample_type_metadata_field = create(:metadata_field, name: "sample_type", base_type: 0)
    end

    describe "GET #show" do
      it "should redirect to root_path for invalid share_id" do
        get :show, params: { id: @sample_one.id, share_id: "invalid_id" }
        expect(response).to redirect_to(root_path)
      end

      it "should redirect to root_path for non-snapshot sample" do
        get :show, params: { id: @sample_two.id, share_id: @snapshot_link.share_id }
        expect(response).to redirect_to(root_path)
      end

      it "should return the correct sample for valid share_id and sample" do
        get :show, params: { format: "json", id: @sample_one.id, share_id: @snapshot_link.share_id }
        expect(response).to have_http_status(:success)

        json_response = JSON.parse(response.body)
        expect(json_response["name"]).to include(@sample_one.name)
        expect(json_response["default_pipeline_run_id"]).to eq(@sample_one.first_pipeline_run.id)
        expect(json_response["default_background_id"]).to eq(@public_background.id)
      end
    end

    describe "GET #report_v2" do
      it "should redirect to root_path for invalid share_id" do
        get :report_v2, params: { id: @sample_one.id, share_id: "invalid_id" }
        expect(response).to redirect_to(root_path)
      end

      it "should redirect to root_path for non-snapshot sample" do
        get :report_v2, params: { id: @sample_two.id, share_id: @snapshot_link.share_id }
        expect(response).to redirect_to(root_path)
      end

      it "should return the correct report_v2 for valid share_id and sample" do
        get :report_v2, params: { id: @sample_one.id, share_id: @snapshot_link.share_id }
        expect(response).to have_http_status(:success)

        json_response = JSON.parse(response.body)
        expect(json_response["metadata"]["hasErrors"]).to eq(false)
      end
    end

    describe "GET #index_v2" do
      it "should redirect to root_path for invalid share_id" do
        get :index_v2, params: { share_id: "invalid_id", project_id: @snapshot_link.project_id, listAllIds: true, basic: true }
        expect(response).to redirect_to(root_path)
      end

      it "should return the correct json_response for valid share_id and empty project (basic)" do
        get :index_v2, params: { share_id: @empty_snapshot_link.share_id, project_id: @empty_snapshot_link.project_id, listAllIds: true, basic: true }
        expect(response).to have_http_status(:success)

        json_response = JSON.parse(response.body)
        expect(json_response).to include_json(all_samples_ids: [])
        expect(json_response["samples"]).to eq([])
      end

      it "should return the correct json_response for valid share_id (basic)" do
        get :index_v2, params: { share_id:  @snapshot_link.share_id, project_id: @snapshot_link.project_id, listAllIds: true, basic: true }
        expect(response).to have_http_status(:success)

        json_response = JSON.parse(response.body)
        expect(json_response).to include_json(all_samples_ids: [@sample_one.id])

        first_sample = json_response["samples"].first
        expect(first_sample).to include_json(id: @sample_one.id)
        expect(first_sample.keys).to contain_exactly("id", "name", "created_at", "host_genome_id")
      end

      it "should return the correct json_response for valid share_id (not basic)" do
        get :index_v2, params: { share_id: @empty_snapshot_link.share_id, project_id: @empty_snapshot_link.project_id, listAllIds: true, basic: false }
        expect(response).to have_http_status(:success)

        json_response = JSON.parse(response.body)
        expect(json_response).to include_json(all_samples_ids: [])
        expect(json_response["samples"]).to eq([])
      end

      it "should return the correct json_response for valid share_id (not basic)" do
        get :index_v2, params: { share_id: @snapshot_link.share_id, project_id: @snapshot_link.project_id, listAllIds: true, basic: false }
        expect(response).to have_http_status(:success)

        json_response = JSON.parse(response.body)
        expect(json_response).to include_json(all_samples_ids: [@sample_one.id])

        first_sample = json_response["samples"].first
        expect(first_sample).to include_json(id: @sample_one.id)
        expect(first_sample.keys).to contain_exactly("id", "name", "created_at", "host_genome_id", "details")
      end
    end

    describe "GET #sample_locations" do
      it "should redirect to root_path for invalid share_id" do
        get :sample_locations, params: { share_id: "invalid_id", domain: "snapshot", project_id: @snapshot_link.project_id }
        expect(response).to redirect_to(root_path)
      end

      it "should return the correct json_response for valid share_id and empty project" do
        get :sample_locations, params: { share_id: @empty_snapshot_link.share_id, domain: "snapshot", project_id: @empty_snapshot_link.project_id }
        expect(response).to have_http_status(:success)

        json_response = JSON.parse(response.body)
        expect(json_response).to eq({})
      end

      it "should return the correct json_response for valid share_id" do
        get :sample_locations, params: { share_id: @snapshot_link.share_id, domain: "snapshot", project_id: @snapshot_link.project_id }
        expect(response).to have_http_status(:success)

        json_response = JSON.parse(response.body)
        expect(json_response).to eq({})
      end
    end

    describe "GET #stats" do
      it "should redirect to root_path for invalid share_id" do
        get :stats, params: { share_id: "invalid_id", domain: "snapshot", project_id: @snapshot_link.project_id }
        expect(response).to redirect_to(root_path)
      end

      it "should return the correct json_response for valid share_id and empty project" do
        get :stats, params: { share_id: @empty_snapshot_link.share_id, domain: "snapshot", project_id: @snapshot_link.project_id }
        expect(response).to have_http_status(:success)

        json_response = JSON.parse(response.body)
        expect(json_response).to include_json(count: 0, projectCount: 0)
      end

      it "should return the correct json_response for valid share_id" do
        get :stats, params: { share_id: @snapshot_link.share_id, domain: "snapshot", project_id: @snapshot_link.project_id }
        expect(response).to have_http_status(:success)

        json_response = JSON.parse(response.body)
        expect(json_response).to include_json(count: 1, projectCount: 1)
      end
    end

    describe "GET #dimensions" do
      it "should redirect to root_path for invalid share_id" do
        get :dimensions, params: { share_id: "invalid_id", domain: "snapshot", project_id: @snapshot_link.project_id }
        expect(response).to redirect_to(root_path)
      end

      it "should return the correct json_response for valid share_id and empty project" do
        get :dimensions, params: { share_id: @empty_snapshot_link.share_id, domain: "snapshot", project_id: @empty_snapshot_link.project_id }
        expect(response).to have_http_status(:success)

        expected_location = {
          "dimension" => "location",
          "values" => [],
        }

        expected_location_v2 = {
          "dimension" => "locationV2",
          "values" => [],
        }

        expected_tissue = {
          "dimension" => "tissue",
          "values" => [],
        }

        json_response = JSON.parse(response.body)
        expect(json_response.first).to include_json(expected_location)
        expect(json_response.second).to include_json(expected_location_v2)
        expect(json_response.last).to include_json(expected_tissue)
      end
    end

    describe "GET #dimensions" do
      it "should redirect to root_path for invalid share_id" do
        get :dimensions, params: { share_id: "invalid_id", domain: "snapshot", project_id: @snapshot_link.project_id }
        expect(response).to redirect_to(root_path)
      end

      it "should return the correct json_response for valid share_id" do
        get :dimensions, params: { share_id: @snapshot_link.share_id, domain: "snapshot", project_id: @snapshot_link.project_id }
        expect(response).to have_http_status(:success)

        expected_location = {
          "dimension" => "location",
          "values" => [{ "value" => "not_set", "text" => "Unknown", "count" => 1 }],
        }

        expected_location_v2 = {
          "dimension" => "locationV2",
          "values" => [{ "value" => "not_set", "text" => "Unknown", "count" => 1 }],
        }

        expected_tissue = {
          "dimension" => "tissue",
          "values" => [{ "value" => "not_set", "text" => "Unknown", "count" => 1 }],
        }

        json_response = JSON.parse(response.body)
        expect(json_response.first).to include_json(expected_location)
        expect(json_response.second).to include_json(expected_location_v2)
        expect(json_response.last).to include_json(expected_tissue)
      end
    end
  end
end
