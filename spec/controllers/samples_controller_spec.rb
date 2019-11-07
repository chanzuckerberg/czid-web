require 'rails_helper'

RSpec.describe SamplesController, type: :controller do
  create_users

  # Non-admin, aka Joe, specific behavior
  context "Joe" do
    before do
      sign_in @joe
    end

    describe "GET raw_results_folder (nonadmin)" do
      it "can see raw results on the user's own samples" do
        project = create(:project, users: [@joe])
        sample = create(:sample, project: project)
        get :raw_results_folder, params: { id: sample.id }
        expect(response).to have_http_status :unauthorized
      end

      it "cannot see raw results on another user's sample" do
        project = create(:project, users: [@joe])
        sample = create(:sample, project: project, user: @joe)
        get :raw_results_folder, params: { id: sample.id }
        expect(response).to have_http_status :success
      end
    end

    describe "GET #taxa_with_reads_suggestions" do
      before do
        @project = create(:project, users: [@joe])
        @sample_one = create(:sample, project: @project, name: "Test Sample One",
                                      pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED, pipeline_version: "3.12" }])
        @sample_two = create(:sample, project: @project, name: "Test Sample Two",
                                      pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED, pipeline_version: "3.12" }])
        @sample_three = create(:sample, project: @project, name: "Test Sample Three",
                                        pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED, pipeline_version: "3.12" }])
      end

      it "should return taxon list with correct sample counts" do
        create(:taxon_count, tax_id: 100, pipeline_run_id: @sample_one.first_pipeline_run.id)
        create(:taxon_count, tax_id: 100, pipeline_run_id: @sample_two.first_pipeline_run.id)
        create(:taxon_count, tax_id: 100, pipeline_run_id: @sample_three.first_pipeline_run.id)
        create(:taxon_count, tax_id: 200, pipeline_run_id: @sample_one.first_pipeline_run.id)
        create(:taxon_count, tax_id: 200, pipeline_run_id: @sample_two.first_pipeline_run.id)
        create(:taxon_count, tax_id: 300, pipeline_run_id: @sample_one.first_pipeline_run.id)

        mock_query = "MOCK_QUERY"

        expect(controller).to receive(:taxon_search).with(mock_query, ["species", "genus"], any_args).exactly(1).times
                                                    .and_return([
                                                                  {
                                                                    "taxid" => 100,
                                                                    "name" => "Mock Taxa 100",
                                                                  },
                                                                  {
                                                                    "taxid" => 200,
                                                                    "name" => "Mock Taxa 200",
                                                                  },
                                                                  {
                                                                    "taxid" => 300,
                                                                    "name" => "Mock Taxa 300",
                                                                  },
                                                                ])

        get :taxa_with_reads_suggestions, params: { format: "json", sampleIds: [@sample_one.id, @sample_two.id, @sample_three.id], query: mock_query }

        expect(response).to have_http_status :success

        json_response = JSON.parse(response.body)
        expect(json_response).to include_json([
                                                {
                                                  "taxid" => 100,
                                                  "name" => "Mock Taxa 100",
                                                  "sample_count" => 3,
                                                },
                                                {
                                                  "taxid" => 200,
                                                  "name" => "Mock Taxa 200",
                                                  "sample_count" => 2,
                                                },
                                                {
                                                  "taxid" => 300,
                                                  "name" => "Mock Taxa 300",
                                                  "sample_count" => 1,
                                                },
                                              ])
      end

      it "should return unauthorized if user doesn't have access to sample" do
        project_admin = create(:project, users: [@admin])
        sample_admin = create(:sample, project: project_admin, name: "Test Sample Admin",
                                       pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED, pipeline_version: "3.12" }])

        create(:taxon_count, tax_id: 100, pipeline_run_id: @sample_one.first_pipeline_run.id)
        create(:taxon_count, tax_id: 100, pipeline_run_id: @sample_two.first_pipeline_run.id)
        create(:taxon_count, tax_id: 100, pipeline_run_id: @sample_three.first_pipeline_run.id)

        get :taxa_with_reads_suggestions, params: { format: "json", sampleIds: [@sample_one.id, sample_admin.id], query: "MOCK_QUERY" }

        expect(response).to have_http_status :unauthorized
      end
    end
  end

  context "User with report_v2 flag" do
    before do
      sign_in @joe
      @joe.add_allowed_feature("report_v2")
      @project = create(:project, users: [@joe])
    end

    describe "GET show_v2" do
      it "can see sample report_v2" do
        sample = create(:sample, project: @project)
        get :show_v2, params: { id: sample.id }
        expect(response).to have_http_status :success
      end
    end
  end

  context "Admin without report_v2 flag" do
    before do
      sign_in @admin
      @project = create(:project, users: [@admin])
    end

    describe "GET show_v2" do
      it "redirected to home page" do
        sample = create(:sample, project: @project)
        get :show_v2, params: { id: sample.id }
        expect(response).to redirect_to(root_path)
      end
    end
  end
end
