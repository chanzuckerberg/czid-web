require "rails_helper"
require "support/samples_controller_constants"

RSpec.describe GraphqlController, type: :request do
  create_users

  before do
    stub_const('SAMPLE_BUCKET_NAME', 'fake_bucket_name')
  end

  before do
    sign_in @joe
  end

  before do
    @project = create(:project, users: [@joe])
    @sample_one = create(:sample, project: @project, name: "Test Sample One",
                                  pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED, pipeline_version: "3.12" }])
  end

  query = <<-GQL
    query GetSamplesReadStats($sampleIds: [Int!]!) {
      sampleReadsStats(sampleIds: $sampleIds) {
        sampleReadsStats {
          sampleId
          initialReads
          name
          pipelineVersion
          sampleId
          wdlVersion
          steps {
            name
            readsAfter
          }
        }
      }
    }
  GQL

  describe "SampleReadsStatsQuery specs" do
    it "can see reads_stats results" do
      allow(ReadsStatsService).to receive(:call).with(a_collection_containing_exactly(@sample_one)).and_return(SamplesControllerConstants::READS_STATS_SERVICE_VALID_RESPONSE)

      post "/graphql", headers: { 'Content-Type' => 'application/json' }, params: {
        query: query,
        context: { current_user: @joe },
        variables: { sampleIds: [@sample_one.id] },
      }.to_json
      expect(response).to have_http_status :success

      result = JSON.parse response.body
      result = result["data"]["sampleReadsStats"]["sampleReadsStats"]

      sample_read_stats = result[0]
      expect(sample_read_stats.keys).to include(:steps.to_s, :initialReads.to_s, :sampleId.to_s)
      expect(sample_read_stats[:steps.to_s].count).to eq(9)
    end

    it "cannot see samples outside of viewable scope" do
      admin_project = create(:project, users: [@admin])
      admin_sample = create(:sample, project: admin_project, name: "Admin Sample", pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED }])

      allow(ReadsStatsService).to receive(:call).with(a_collection_containing_exactly(@sample_one)).and_return(SamplesControllerConstants::READS_STATS_SERVICE_VALID_RESPONSE)
      allow(ReadsStatsService).to receive(:call).with(a_collection_including(admin_sample)).and_return({})

      # get :reads_stats, params: { sampleIds: [@sample_one.id, admin_sample.id] }
      post "/graphql", headers: { 'Content-Type' => 'application/json' }, params: {
        query: query,
        context: { current_user: @joe },
        variables: { sampleIds: [@sample_one.id, admin_sample.id] },
      }.to_json

      expect(response).to have_http_status :success

      result = JSON.parse response.body
      result = result["data"]["sampleReadsStats"]["sampleReadsStats"]

      expect(result.length).to eq(1)
    end
  end
end
