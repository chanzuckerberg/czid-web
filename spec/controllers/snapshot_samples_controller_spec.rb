require 'rails_helper'

RSpec.describe SnapshotSamplesController, type: :controller do
  before do
    create(:metadata_field, name: "collection_location", base_type: 0)
    create(:metadata_field, name: "collection_location_v2", base_type: 3)
    create(:metadata_field, name: "sample_type", base_type: 0)
    create(:host_genome, name: "Human")
    nucleotide_type = create(:metadata_field, name: "nucleotide_type", base_type: 0)

    user = create(:user)
    project = create(:project, users: [user], metadata_fields: [nucleotide_type])
    fake_sfn_execution_arn = "fake:sfn:execution:arn".freeze

    @sample_one = create(:sample,
                         project: project,
                         metadata_fields: { "nucleotide_type" => nil },
                         pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED, sfn_execution_arn: fake_sfn_execution_arn }])
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
      it "should redirect to page_not_found_path" do
        get :show, params: { id: @sample_one.id, share_id: @snapshot_link.share_id }
        expect(response).to redirect_to(page_not_found_path)
      end
    end

    describe "GET #report_v2" do
      it "should redirect to page_not_found_path" do
        get :report_v2, params: { id: @sample_one.id, share_id: @snapshot_link.share_id }
        expect(response).to redirect_to(page_not_found_path)
      end
    end

    describe "GET #index_v2" do
      it "should redirect to page_not_found_path" do
        get :index_v2, params: { share_id: @snapshot_link.share_id, project_id: @snapshot_link.project_id, listAllIds: true, basic: true }
        expect(response).to redirect_to(page_not_found_path)
      end
    end

    describe "GET #stats" do
      it "should redirect to page_not_found_path" do
        get :stats, params: { share_id: @snapshot_link.share_id, domain: "snapshot", project_id: @snapshot_link.project_id }
        expect(response).to redirect_to(page_not_found_path)
      end
    end

    describe "GET #dimensions" do
      it "should redirect to page_not_found_path" do
        get :dimensions, params: { share_id: @snapshot_link.share_id, domain: "snapshot", project_id: @snapshot_link.project_id }
        expect(response).to redirect_to(page_not_found_path)
      end
    end

    describe "GET #metadata" do
      it "should redirect to page_not_found_path" do
        get :metadata, params: { id: @sample_one.id, share_id: @snapshot_link.share_id }
        expect(response).to redirect_to(page_not_found_path)
      end
    end

    describe "GET #metadata_fields" do
      it "should redirect to page_not_found_path" do
        get :metadata_fields, params: { sampleIds: [@sample_one.id], share_id: @snapshot_link.share_id }
        expect(response).to redirect_to(page_not_found_path)
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
    end

    describe "GET #show" do
      it "should redirect to page_not_found_path for invalid share_id" do
        get :show, params: { id: @sample_one.id, share_id: "invalid_id" }
        expect(response).to redirect_to(page_not_found_path)
      end

      it "should redirect to page_not_found_path for non-snapshot sample" do
        get :show, params: { id: @sample_two.id, share_id: @snapshot_link.share_id }
        expect(response).to redirect_to(page_not_found_path)
      end

      it "should return the correct sample for valid share_id and sample" do
        get :show, params: { format: "json", id: @sample_one.id, share_id: @snapshot_link.share_id }
        expect(response).to have_http_status(:success)

        json_response = JSON.parse(response.body)
        expect(json_response["name"]).to include(@sample_one.name)
        expect(json_response["default_pipeline_run_id"]).to eq(@sample_one.first_pipeline_run.id)
        expect(json_response["default_background_id"]).to eq(@sample_one.default_background_id)
      end
    end

    describe "GET #report_v2" do
      it "should redirect to page_not_found_path for invalid share_id" do
        get :report_v2, params: { id: @sample_one.id, share_id: "invalid_id" }
        expect(response).to redirect_to(page_not_found_path)
      end

      it "should redirect to page_not_found_path for non-snapshot sample" do
        get :report_v2, params: { id: @sample_two.id, share_id: @snapshot_link.share_id }
        expect(response).to redirect_to(page_not_found_path)
      end

      it "should return the correct report_v2 for valid share_id, sample, and background" do
        get :report_v2, params: { id: @sample_one.id, background: @public_background.id, share_id: @snapshot_link.share_id }
        expect(response).to have_http_status(:success)

        json_response = JSON.parse(response.body)
        expect(json_response["metadata"]["hasErrors"]).to eq(false)
      end
    end

    describe "GET #index_v2" do
      it "should redirect to page_not_found_path for invalid share_id" do
        get :index_v2, params: { share_id: "invalid_id", project_id: @snapshot_link.project_id, listAllIds: true, basic: true }
        expect(response).to redirect_to(page_not_found_path)
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

    describe "GET #stats" do
      it "should redirect to page_not_found_path for invalid share_id" do
        get :stats, params: { share_id: "invalid_id", domain: "snapshot", project_id: @snapshot_link.project_id }
        expect(response).to redirect_to(page_not_found_path)
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
      it "should redirect to page_not_found_path for invalid share_id" do
        get :dimensions, params: { share_id: "invalid_id", domain: "snapshot", project_id: @snapshot_link.project_id }
        expect(response).to redirect_to(page_not_found_path)
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

    describe "GET #metadata" do
      it "should redirect to page_not_found_path for invalid share_id" do
        get :metadata, params: { id: @sample_one.id, share_id: "invalid_id" }
        expect(response).to redirect_to(page_not_found_path)
      end

      it "should redirect to page_not_found_path for non-snapshot sample" do
        get :metadata, params: { id: @sample_two.id, share_id: @snapshot_link.share_id }
        expect(response).to redirect_to(page_not_found_path)
      end

      it "should return the correct json_response for valid share_id" do
        get :metadata, params: { id: @sample_one.id, share_id: @snapshot_link.share_id }
        expect(response).to have_http_status(:success)
        json_response = JSON.parse(response.body)

        # check for expected keys
        expected_additional_info_keys = ["editable", "ercc_comparison", "host_genome_name", "host_genome_taxa_category", "name",
                                         "notes", "pipeline_run", "project_id", "project_name", "summary_stats", "upload_date",]
        expected_pipeline_run_keys = ["adjusted_remaining_reads", "alert_sent", "alignment_config_id", "assembled", "created_at",
                                      "dag_vars", "error_message", "finalized", "fraction_subsampled", "id", "job_status",
                                      "known_user_error", "host_subtracted", "max_input_fragments", "pipeline_branch", "pipeline_commit",
                                      "pipeline_execution_strategy", "pipeline_version", "results_finalized", "sample_id",
                                      "sfn_execution_arn", "subsample", "total_ercc_reads", "total_reads", "truncated",
                                      "unmapped_reads", "updated_at", "use_taxon_whitelist", "version", "wdl_version", "s3_output_prefix",]
        expected_pipeline_version_keys = ["alignment_db", "pipeline"]
        expect(json_response.keys).to contain_exactly("metadata", "additional_info")
        expect(json_response["additional_info"].keys).to match_array(expected_additional_info_keys)
        expect(json_response["additional_info"]["pipeline_run"].keys).to match_array(expected_pipeline_run_keys)
        expect(json_response["additional_info"]["pipeline_run"]["version"].keys).to match_array(expected_pipeline_version_keys)

        # check for expected snapshot info
        expect(json_response["additional_info"]["project_id"]).to eq(@snapshot_link.project_id)
        expect(json_response["additional_info"]["pipeline_run"]["sample_id"]).to eq(@sample_one.id)
        expect(json_response["additional_info"]["pipeline_run"]["id"]).to eq(@sample_one.first_pipeline_run.id)
      end
    end

    describe "GET #metadata_fields" do
      it "should redirect to page_not_found_path for invalid share_id" do
        get :metadata_fields, params: { sampleIds: [@sample_one.id], share_id: "invalid_id" }
        expect(response).to redirect_to(page_not_found_path)
      end

      it "should exclude non-snapshot sample for valid share_id" do
        # excludes sample_two
        get :metadata_fields, params: { sampleIds: [@sample_two.id], share_id: @snapshot_link.share_id }
        expect(response).to have_http_status(:success)
        json_response = JSON.parse(response.body)
        expect(json_response).to eq([])

        get :metadata_fields, params: { sampleIds: [@sample_one.id, @sample_two.id], share_id: @snapshot_link.share_id }
        expect(response).to have_http_status(:success)
        json_response = JSON.parse(response.body)
        expect(json_response.first["key"]).to eq("nucleotide_type")
      end

      it "should return the correct json_response for valid share_id" do
        get :metadata_fields, params: { sampleIds: [@sample_one.id], share_id: @snapshot_link.share_id }
        expect(response).to have_http_status(:success)

        json_response = JSON.parse(response.body)
        expect(json_response.first["key"]).to eq("nucleotide_type")
      end
    end

    describe "GET #coverage_viz_summary" do
      it "should set the sample and call the parent method" do
        expect_any_instance_of(SnapshotSamplesController).to receive(:set_snapshot_sample)
        expect_any_instance_of(SamplesController).to receive(:coverage_viz_summary)

        get :coverage_viz_summary, params: { id: @sample_one.id, share_id: @snapshot_link.share_id, format: "json" }
        expect(response).to have_http_status(:success)
      end
    end

    describe "GET #coverage_viz_data" do
      it "should set the sample and call the parent method" do
        expect_any_instance_of(SnapshotSamplesController).to receive(:set_snapshot_sample)
        expect_any_instance_of(SamplesController).to receive(:coverage_viz_data)

        get :coverage_viz_data, params: { id: @sample_one.id, share_id: @snapshot_link.share_id, format: "json" }
        expect(response).to have_http_status(:success)
      end
    end
  end
end
