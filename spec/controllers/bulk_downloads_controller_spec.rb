require 'rails_helper'

RSpec.describe BulkDownloadsController, type: :controller do
  create_users

  # Admin specific behavior
  context "Normal user with bulk_downloads flag" do
    # create_users
    before do
      sign_in @joe
      @joe.add_allowed_feature("bulk_downloads")
      @project = create(:project, users: [@joe])
    end

    describe "POST #create" do
      it "should create new bulk download" do
        @sample_one = create(:sample, project: @project,
                                      pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED }])
        @sample_two = create(:sample, project: @project,
                                      pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED }])

        bulk_download_params = {
          download_type: "sample_overview",
          sample_ids: [@sample_one, @sample_two],
          params: {
            foo: "bar",
          },
        }

        post :create, params: bulk_download_params
        expect(response).to have_http_status(200)
        json_response = JSON.parse(response.body)
        bulk_download = BulkDownload.find(json_response["id"])

        # Verify that bulk download was created correctly.
        expect(bulk_download).not_to eq(nil)
        expect(bulk_download.download_type).to eq("sample_overview")
        expect(bulk_download.pipeline_run_ids).to include(@sample_one.pipeline_runs.first.id)
        expect(bulk_download.pipeline_run_ids).to include(@sample_two.pipeline_runs.first.id)
        expect(bulk_download.user_id).to eq(@joe.id)
        expect(bulk_download.status).to eq(BulkDownload::STATUS_WAITING)
        expect(bulk_download.params_json).to eq({ foo: "bar" }.to_json)
      end

      it "should error if a requested sample is not done running" do
        @sample_one = create(:sample, project: @project,
                                      pipeline_runs_data: [{ finalized: 0, job_status: PipelineRun::STATUS_RUNNING }])

        bulk_download_params = {
          download_type: "sample_overview",
          sample_ids: [@sample_one],
        }

        post :create, params: bulk_download_params
        expect(response).to have_http_status(422)

        json_response = JSON.parse(response.body)
        expect(json_response["error"]).to eq(BulkDownloadsHelper::SAMPLE_STILL_RUNNING_ERROR)
      end

      it "should error if a requested sample failed" do
        @sample_one = create(:sample, project: @project,
                                      pipeline_runs_data: [{ finalized: 1, job_status: "1.Host Filtering-FAILED" }])

        bulk_download_params = {
          download_type: "sample_overview",
          sample_ids: [@sample_one],
        }

        post :create, params: bulk_download_params
        expect(response).to have_http_status(422)

        json_response = JSON.parse(response.body)
        expect(json_response["error"]).to eq(BulkDownloadsHelper::SAMPLE_FAILED_ERROR)
      end

      it "should error if a requested sample is not viewable by the user" do
        @sample_one = create(:sample, project: @project,
                                      pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED }])
        @project_admin = create(:project, users: [@admin])
        @sample_two = create(:sample, project: @project_admin,
                                      pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED }])

        bulk_download_params = {
          download_type: "sample_overview",
          sample_ids: [@sample_one, @sample_two],
        }

        post :create, params: bulk_download_params
        expect(response).to have_http_status(422)

        json_response = JSON.parse(response.body)
        expect(json_response["error"]).to eq(BulkDownloadsHelper::SAMPLE_NO_PERMISSION_ERROR)
      end

      it "checks and uses the most recent pipeline run for a sample" do
        travel_to 1.day.ago do
          @sample_one = create(:sample, project: @project,
                                        pipeline_runs_data: [
                                          { finalized: 1, job_status: PipelineRun::STATUS_FAILED },
                                        ])
        end

        create(:pipeline_run, sample: @sample_one, finalized: 1, job_status: PipelineRun::STATUS_CHECKED)

        bulk_download_params = {
          download_type: "sample_overview",
          sample_ids: [@sample_one],
        }

        post :create, params: bulk_download_params
        expect(response).to have_http_status(200)
        json_response = JSON.parse(response.body)
        bulk_download = BulkDownload.find(json_response["id"])

        # Verify that bulk download uses correct pipeline run id.
        expect(bulk_download).not_to eq(nil)
        expect(bulk_download.pipeline_run_ids).to include(@sample_one.first_pipeline_run.id)
      end
    end

    describe "GET #index" do
      it "should return only bulk downloads viewable to the user" do
        @sample_one = create(:sample, project: @project,
                                      pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED }])
        @project_admin = create(:project, users: [@admin])
        @sample_two = create(:sample, project: @project_admin,
                                      pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED }])

        create(:bulk_download, user: @joe, pipeline_run_ids: [@sample_one.first_pipeline_run.id], download_type: "reads_non_host")
        create(:bulk_download, user: @admin, pipeline_run_ids: [@sample_two.first_pipeline_run.id])

        get :index, format: :json

        expect(response).to have_http_status(200)
        bulk_downloads = JSON.parse(response.body)

        expect(bulk_downloads.length).to eq(1)
        expect(bulk_downloads[0]["user_id"]).to eq(@joe.id)
        expect(bulk_downloads[0]["download_type"]).to eq("reads_non_host")
        expect(bulk_downloads[0]["num_samples"]).to eq(1)
        # Should not return pipeline runs.
        expect(bulk_downloads[0]["pipeline_runs"]).to eq(nil)
      end
    end

    describe "GET #show" do
      it "should return the bulk download and download type" do
        @sample_one = create(:sample, project: @project, name: "Joes Sample",
                                      pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED }])

        bulk_download_joe = create(:bulk_download, user: @joe, pipeline_run_ids: [@sample_one.first_pipeline_run.id], download_type: "reads_non_host")

        get :show, params: { format: "json", id: bulk_download_joe.id }

        expect(response).to have_http_status(200)
        json_response = JSON.parse(response.body)

        expect(json_response["bulk_download"]["user_id"]).to eq(@joe.id)
        expect(json_response["bulk_download"]["download_type"]).to eq("reads_non_host")
        expect(json_response["bulk_download"]["num_samples"]).to eq(1)
        expect(json_response["bulk_download"]["pipeline_runs"].length).to eq(1)
        expect(json_response["bulk_download"]["pipeline_runs"][0]["sample_name"]).to eq("Joes Sample")
        expect(json_response["download_type"]["display_name"]).to eq("Reads (Non-host)")
      end

      it "should error if the requested bulk download is not viewable" do
        @project_admin = create(:project, users: [@admin])
        @sample_two = create(:sample, project: @project_admin,
                                      pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED }])

        bulk_download_admin = create(:bulk_download, user: @admin, pipeline_run_ids: [@sample_two.first_pipeline_run.id])

        get :show, params: { format: "json", id: bulk_download_admin.id }

        expect(response).to have_http_status(404)
        json_response = JSON.parse(response.body)

        expect(json_response["error"]).to eq(BulkDownloadsHelper::BULK_DOWNLOAD_NOT_FOUND)
      end
    end
  end

  context "Admin user without bulk_downloads flag" do
    before do
      sign_in @admin
      @project = create(:project, users: [@admin])
    end

    describe "POST #create" do
      it "does not call action" do
        @sample_one = create(:sample, project: @project,
                                      pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED }])

        bulk_download_params = {
          download_type: "sample_overview",
          sample_ids: [@sample_one],
        }

        post :create, params: bulk_download_params

        expect(controller).not_to receive(:create)
      end

      it "redirected to home page" do
        @sample_one = create(:sample, project: @project,
                                      pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED }])

        bulk_download_params = {
          download_type: "sample_overview",
          sample_ids: [@sample_one],
        }

        post :create, params: bulk_download_params

        expect(response).to redirect_to(root_path)
      end
    end

    describe "GET #index" do
      it "does not call action" do
        get :index
        expect(controller).not_to receive(:index)
      end

      it "redirected to home page" do
        get :index
        expect(response).to redirect_to(root_path)
      end
    end

    describe "GET #show" do
      it "does not call action" do
        get :show, params: { format: "json", id: "123" }
        expect(controller).not_to receive(:show)
      end

      it "redirected to home page" do
        get :show, params: { format: "json", id: "123" }
        expect(response).to redirect_to(root_path)
      end
    end
  end
end
