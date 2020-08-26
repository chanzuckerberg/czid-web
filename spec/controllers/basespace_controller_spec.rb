require 'rails_helper'

BASESPACE_PAIRED_END_FASTQ_SAMPLE = {
  "Id" => "1",
  "Name" => "Sample 1",
  "TotalSize" => 1000,
  "Project" => {
    "Name" => "Mock Project",
  },
  "DatasetType" => {
    "Name" => "Illumina Fastq",
  },
  "Attributes" => {
    "common_fastq" => {
      "IsPairedEnd" => true,
    },
  },
}.freeze

BASESPACE_SINGLE_END_FASTQ_SAMPLE = {
  "Id" => "2",
  "Name" => "Sample 2",
  "TotalSize" => 1001,
  "Project" => {
    "Name" => "Mock Project",
  },
  "DatasetType" => {
    "Name" => "Illumina Fastq",
  },
  "Attributes" => {
    "common_fastq" => {
      "IsPairedEnd" => false,
    },
  },
}.freeze

BASESPACE_NON_FASTQ_SAMPLE = {
  "Id" => "1",
  "Name" => "Sample 1",
  "TotalSize" => 1000,
  "Project" => {
    "Name" => "Mock Project",
  },
  "DatasetType" => {
    "Name" => "Common Files",
  },
  "Attributes" => {},
}.freeze

RSpec.describe BasespaceController, type: :controller do
  create_users

  context "non-admin user" do
    before do
      sign_in @joe
    end

    describe "GET oauth" do
      let(:access_token) { "12345" }

      before do
        allow(HttpHelper).to receive(:post_json).and_return("access_token" => access_token)
        stub_const('ENV', ENV.to_hash.merge("BASESPACE_OAUTH_REDIRECT_URI" => "MOCK_URI",
                                            "BASESPACE_CLIENT_ID" => "MOCK_ID",
                                            "BASESPACE_CLIENT_SECRET" => "MOCK_SECRET"))
      end

      it "renders the oauth template" do
        get :oauth, params: { code: "MOCK_CODE" }
        expect(response).to render_template("oauth")
      end

      it "assigns view variables correctly" do
        get :oauth, params: { code: "MOCK_CODE" }
        expect(assigns(:access_token)).to eq(access_token)
      end

      context "when no code param is provided" do
        it "assigns view variables correctly" do
          get :oauth, params: {}
          expect(response).to render_template("oauth")
          expect(assigns(:access_token)).to eq(nil)
        end
      end
    end

    describe "GET projects" do
      before do
        allow(HttpHelper).to receive(:get_json)
          .and_return(
            "Response" => {
              "Items" => [
                {
                  "Id" => "1",
                  "Name" => "Project 1",
                },
                {
                  "Id" => "2",
                  "Name" => "Project 2",
                },
              ],
            }
          )
      end

      it "returns projects" do
        get :projects, params: { access_token: "123" }

        json_response = JSON.parse(response.body)
        expect(json_response).to include_json(
          [
            {
              "id" => "1",
              "name" => "Project 1",
            },
            {
              "id" => "2",
              "name" => "Project 2",
            },
          ]
        )
      end

      context "when no access token is provided" do
        it "returns an error" do
          get :projects, params: {}

          json_response = JSON.parse(response.body)
          expect(json_response).to include_json(error: "basespace access token required")
        end
      end

      context "when basespace API call fails" do
        before do
          allow(HttpHelper).to receive(:get_json)
            .and_return("ResponseStatus" => {
                          "Message" => "Failed to list projects",
                        })
        end

        it "returns an error" do
          expect(LogUtil).to receive(:log_err).with("Fetch Basespace projects failed with error: Failed to list projects").exactly(1).times
          get :projects, params: { access_token: "123" }

          json_response = JSON.parse(response.body)
          expect(json_response).to include_json(error: "unable to fetch data from basespace")
        end
      end
    end

    describe "GET samples_for_project" do
      before do
        allow(HttpHelper).to receive(:get_json).and_return(
          "Items" => [
            BASESPACE_PAIRED_END_FASTQ_SAMPLE,
            BASESPACE_SINGLE_END_FASTQ_SAMPLE,
          ]
        )
      end

      it "returns samples for project" do
        get :samples_for_project, params: { access_token: "123", basespace_project_id: 77 }

        json_response = JSON.parse(response.body)
        expect(json_response).to include_json(
          [
            {
              "basespace_dataset_id" => "1",
              "name" => "Sample 1",
              "file_size" => 1000,
              "file_type" => "Paired-end FASTQ",
              "basespace_project_id" => "77",
              "basespace_project_name" => "Mock Project",
            },
            {
              "basespace_dataset_id" => "2",
              "name" => "Sample 2",
              "file_size" => 1001,
              "file_type" => "Single-end FASTQ",
              "basespace_project_id" => "77",
              "basespace_project_name" => "Mock Project",
            },
          ]
        )
      end

      context "when some samples are non-fastq" do
        before do
          allow(HttpHelper).to receive(:get_json).and_return(
            "Items" => [
              BASESPACE_NON_FASTQ_SAMPLE,
              BASESPACE_SINGLE_END_FASTQ_SAMPLE,
            ]
          )
        end

        it "filters out non-fastq samples" do
          get :samples_for_project, params: { access_token: "123", basespace_project_id: 77 }

          json_response = JSON.parse(response.body)
          expect(json_response).to include_json(
            [
              {
                "basespace_dataset_id" => "2",
                "name" => "Sample 2",
                "file_size" => 1001,
                "file_type" => "Single-end FASTQ",
                "basespace_project_id" => "77",
                "basespace_project_name" => "Mock Project",
              },
            ]
          )
        end
      end

      context "when no access token is provided" do
        it "returns an error" do
          get :samples_for_project, params: { basespace_project_id: 77 }

          json_response = JSON.parse(response.body)
          expect(json_response).to include_json("error" => "basespace access token required")
        end
      end

      context "when no basespace project id is provided" do
        it "returns an error" do
          get :samples_for_project, params: { access_token: "123" }

          json_response = JSON.parse(response.body)
          expect(json_response).to include_json("error" => "basespace project id required")
        end
      end

      context "when basespace API call fails" do
        before do
          allow(HttpHelper).to receive(:get_json)
            .and_return("ErrorMessage" => "Failed to get samples for project")
        end

        it "returns an error" do
          expect(LogUtil).to receive(:log_err).with("Fetch samples for Basespace project failed with error: Failed to get samples for project").exactly(1).times
          get :samples_for_project, params: { access_token: "123", basespace_project_id: 77 }

          json_response = JSON.parse(response.body)
          expect(json_response).to include_json(error: "unable to fetch data from basespace")
        end
      end
    end
  end
end
