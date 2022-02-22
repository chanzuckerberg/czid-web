require 'rails_helper'

RSpec.describe BenchmarksController, type: :controller do
  DEFAULT_BENCHMARK_PROJECT = "Bench Project".freeze
  DEFAULT_SAMPLE_NAME = "Sample sample".freeze
  DEFAULT_PIPELINE_VERSION = "5.0".freeze

  BENCHMARKS_CONFIG_JSON = JSON.generate(
    "README": ["Configuration description"],
    "defaults": {
      "how_to_use_these_defaults": "These properties may be overridden in each entry of active_benchmarks below.",
      "project_name": DEFAULT_BENCHMARK_PROJECT,
      "user_email": "sample@czid.org",
      "frequency_hours": 24,
      "trigger_on_webapp_change": true,
      "trigger_on_pipeline_change": true,
      "pipeline_branch": "master",
      "host": "Human",
      "comment": "Default benchmark comment.",
    },
    "active_benchmarks": {
      "active_benchmark_1_file_path": {
        "comment": "Sample active benchmark 1",
        "environments": ["prod", "staging"],
      },
      "active_benchmark_2_file_path": {
        "comment": "Sample active benchmark 2",
        "environments": ["test"],
      },
    },
    "retired_benchmarks": {
      "retired_benchmark_3_file_path": {
        "comment": "Sample retired benchmark 2",
        "environments": ["prod"],
        "project_name": "IDSeq Bench Prod",
      },
      "retired_benchmark_4_file_path": {
        "comment": "Sample retired benchmark 3",
        "environments": ["staging"],
        "project_name": "IDSeq Bench Staging",
      },
      "retired_benchmark_5_file_path": {
        "comment": "Sample retired benchmark 4",
        "environments": ["test"],
        "project_name": "IDSeq Bench Test",
      },
    }
  )

  BENCHMARKS_PARSED_JSON = JSON.parse(
    JSON.generate(
      "active_benchmarks": [
        {
          "comment": "Sample active benchmark 2",
          "frequency_hours": 24,
          "host": "Human",
          "last_run": {
            "pipeline_version": DEFAULT_PIPELINE_VERSION,
            "sample_name": DEFAULT_SAMPLE_NAME,
          },
          "project_name": DEFAULT_BENCHMARK_PROJECT,
          "trigger_on_pipeline_change": true,
          "trigger_on_webapp_change": true,
          "user_email": "sample@czid.org",
        },
      ],
      "retired_benchmarks": [
        {
          "comment": "Sample retired benchmark 4",
          "frequency_hours": 24,
          "host": "Human",
          "project_name": "IDSeq Bench Test",
          "trigger_on_pipeline_change": true,
          "trigger_on_webapp_change": true,
          "user_email": "sample@czid.org",
        },
      ]
    )
  )

  buckets = {
    BenchmarksHelper::IDSEQ_BENCH_BUCKET => {
      BenchmarksHelper::IDSEQ_BENCH_KEY => {
        body: BENCHMARKS_CONFIG_JSON,
      },
    },
  }

  create_users

  # Admin specific behavior
  context "Admin user" do
    describe "GET #index" do
      before do
        sign_in @admin
        s3 = Aws::S3::Client.new(stub_responses: true)
        s3.stub_responses(:get_object, lambda { |context|
          obj = buckets.dig(context.params[:bucket], context.params[:key])
          obj || 'NoSuchKey'
        })
        stub_const("S3_CLIENT", s3)

        create(
          :project,
          name: DEFAULT_BENCHMARK_PROJECT,
          samples_data: [{ name: DEFAULT_SAMPLE_NAME, pipeline_runs_data: [{ pipeline_version: DEFAULT_PIPELINE_VERSION }] }]
        )
      end

      describe "with correct config and benchmarks" do
        before do
          get :index, format: :json
          @json_response = JSON.parse(response.body)
        end

        it "returns http success" do
          expect(response).to have_http_status(:success)
        end

        it "is not empty" do
          expect(@json_response).not_to be_empty
        end

        it "matches expected filtered json" do
          expect(@json_response).to eq(BENCHMARKS_PARSED_JSON)
        end
      end

      context "with missing config" do
        before do
          buckets = {
            BenchmarksHelper::IDSEQ_BENCH_BUCKET => {},
          }
          get :index, format: :json
        end

        it "returns http success" do
          expect(response).to have_http_status(:success)
        end

        it "is empty" do
          json_response = JSON.parse(response.body)
          expect(json_response).to be_empty
        end
      end

      describe "with bad config" do
        before do
          buckets = {
            BenchmarksHelper::IDSEQ_BENCH_BUCKET => {
              BenchmarksHelper::IDSEQ_BENCH_KEY => {
                body: "{Invalid JSON}",
              },
            },
          }
          get :index, format: :json
        end

        it "returns http success" do
          expect(response).to have_http_status(:success)
        end

        it "is empty" do
          json_response = JSON.parse(response.body)
          expect(json_response).to be_empty
        end
      end
    end
  end

  context "Joe user" do
    before do
      sign_in @joe
    end

    describe "GET #index" do
      it "does not call action" do
        expect(controller).not_to receive(:index)
        get :index, format: :json
      end

      it "redirected to home page" do
        get :index, format: :json
        expect(response).to redirect_to(root_path)
      end
    end
  end
end
