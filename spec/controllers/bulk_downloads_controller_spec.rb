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
        expect(bulk_download.users).to include(@joe)
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
        @sample_one = create(:sample, project: @project,
                                      pipeline_runs_data: [
                                        { finalized: 1, job_status: PipelineRun::STATUS_FAILED },
                                        { finalized: 1, job_status: PipelineRun::STATUS_CHECKED },
                                      ])

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
  end
end
