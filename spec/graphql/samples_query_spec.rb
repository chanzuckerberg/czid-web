require "rails_helper"

RSpec.describe GraphqlController, type: :request do
  create_users

  before do
    sign_in @joe
  end

  query = <<GQL
  query GetSamples(
    $projectId: Int!
    # $search: String!
    $domain: String
    $limit: Int
    $offset: Int
    $orderBy: String
    $orderDir: String
    $listAllIds: Boolean
    $basic: Boolean
    $sampleIds: [Int!]
    $hostIds: [Int!]
    $location: String
    $locationV2: [String!]
    $taxIds: [Int!]
    $taxLevels: [String!]
    $thresholdFilterInfo: String
    $annotations: [Annotation!]
    $time: [String!]
    $tissue: [String!]
    $visibility: [String!]
    $searchString: String
    $requestedSampleIds: [Int!]
    $workflow: String
  ) {
    samplesList(
      projectId: $projectId
      # search: $search
      domain: $domain
      limit: $limit
      offset: $offset
      orderBy: $orderBy
      orderDir: $orderDir
      listAllIds: $listAllIds
      basic: $basic
      sampleIds: $sampleIds
      hostIds: $hostIds
      location: $location
      locationV2: $locationV2
      taxIds: $taxIds
      taxLevels: $taxLevels
      thresholdFilterInfo: $thresholdFilterInfo
      annotations: $annotations
      time: $time
      tissue: $tissue
      visibility: $visibility
      searchString: $searchString
      requestedSampleIds: $requestedSampleIds
      workflow: $workflow
    ) {
        samples
          {
            id
            name
            createdAt
            projectId
            hostGenomeId
            privateUntil
            public
            details {
              dbSample {
                id
                name
                createdAt
                updatedAt
                projectId
                status
                sampleNotes
                s3PreloadResultPath
                s3StarIndexPath
                s3Bowtie2IndexPath
                hostGenomeId
                userId
                subsample
                pipelineBranch
                alignmentConfigName
                webCommit
                pipelineCommit
                dagVars
                maxInputFragments
                clientUpdatedAt
                uploadedFromBasespace
                uploadError
                basespaceAccessToken
                doNotProcess
                pipelineExecutionStrategy
                useTaxonWhitelist
                initialWorkflow
                inputFiles {
                    id
                    name
                    presignedUrl
                    sampleId
                    createdAt
                    updatedAt
                    sourceType
                    source
                    parts
                    uploadClient
                  }

                hostGenomeName
                privateUntil
              }
              metadata {
                collectionDate
                collectionLocationV2
                nucleotideType
                sampleType
                waterControl
              }
              derivedSampleOutput {
                pipelineRun {
                  id
                  sampleId
                  createdAt
                  updatedAt
                  jobStatus
                  finalized
                  totalReads
                  adjustedRemainingReads
                  unmappedReads
                  subsample
                  pipelineBranch
                  totalErccReads
                  fractionSubsampled
                  pipelineVersion
                  pipelineCommit
                  truncated
                  resultsFinalized
                  alignmentConfigId
                  alertSent
                  dagVars
                  assembled
                  maxInputFragments
                  errorMessage
                  knownUserError
                  pipelineExecutionStrategy
                  sfnExecutionArn
                  useTaxonWhitelist
                  wdlVersion
                  s3OutputPrefix
                  executedAt
                  timeToFinalized
                  timeToResultsFinalized
                  qcPercent
                  compressionRatio
                  deprecated
                }
                hostGenomeName
                projectName
                summaryStats {
                  adjustedRemainingReads
                  compressionRatio
                  qcPercent
                  percentRemaining
                  unmappedReads
                  insertSizeMean
                  insertSizeStandardDeviation
                  lastProcessedAt
                  readsAfterStar
                  readsAfterTrimmomatic
                  readsAfterPriceseq
                  readsAfterCzidDedup
                }
              }
              uploader {
                  name
                  id
              }
              mngsRunInfo {
                totalRuntime
                withAssembly
                resultStatusDescription
                finalized
                reportReady
                createdAt
              }
              workflowRunsCountByWorkflow
            }
          }
        sampleIds
    }
  }
GQL

  describe "SamplesQuery Specs" do
    it "loads list of samples with correct visibilty" do
      project = create(:project, users: [@joe], days_to_keep_sample_private: 365)
      sample_private = create(:sample, project: project, user: @joe, created_at: 6.months.ago)
      sample_public = create(:sample, project: project, user: @joe, created_at: 2.years.ago)

      post "/graphql", headers: { 'Content-Type' => 'application/json' }, params: {
        query: query,
        context: { current_user: @joe },
        variables: { projectId: project.id.to_i, domain: 'my_data' },
      }.to_json
      expect(response).to have_http_status 200

      result = JSON.parse response.body
      result = result["data"]["samplesList"]

      expect(result["samples"].length).to eq(2)
      expect(result).to include_json(
        samples: [
          { id: sample_public.id, public: 1 },
          { id: sample_private.id, public: 0 },
        ]
      )
    end
  end

  it "loads a correctly sorted list of samples (without sorting_v0 enabled)" do
    project = create(:project, users: [@joe])
    sample_one = create(:sample, project: project, user: @joe, name: "Test Sample B")
    sample_two = create(:sample, project: project, user: @joe, name: "Test Sample A")
    post "/graphql", headers: { "Content-Type" => "application/json" }, params: {
      query: query,
      context: { current_user: @joe },
      variables: { projectId: project.id, domain: "my_data", orderBy: "name", orderDir: "asc" },
    }.to_json
    expect(response).to have_http_status 200

    json_response = JSON.parse(response.body)
    json_response = json_response["data"]["samplesList"]
    expect(json_response["samples"].length).to eq(2)
    expect(json_response).to include_json(
      samples: [
        { id: sample_one.id },
        { id: sample_two.id },
      ]
    )
  end

  it "loads samples ordered by descending creation date if no sort parameters are specified" do
    @joe.add_allowed_feature("sorting_v0")

    project = create(:project, users: [@joe])
    sample_one = create(:sample, project: project, user: @joe, name: "Test Sample B")
    sample_two = create(:sample, project: project, user: @joe, name: "Test Sample A")

    post "/graphql", headers: { "Content-Type" => "application/json" }, params: {
      query: query,
      context: { current_user: @joe },
      variables: { projectId: project.id, domain: "my_data" },
    }.to_json
    expect(response).to have_http_status 200

    json_response = JSON.parse(response.body)
    json_response = json_response["data"]["samplesList"]

    expect(json_response["samples"].length).to eq(2)
    expect(json_response).to include_json(samples: [
                                            { id: sample_two.id },
                                            { id: sample_one.id },
                                          ])
  end

  it "returns basic samples with correctly formatted date" do
    project = create(:project, users: [@joe])
    create(:sample, name: "Mosquito Sample", project: project, user: @joe, host_genome_name: "Mosquito", metadata_fields: { collection_date: "2019-01-01" })

    post "/graphql", headers: { "Content-Type" => "application/json" }, params: {
      query: query,
      context: { current_user: @joe },
      variables: { projectId: project.id },
    }.to_json

    json_response = JSON.parse(response.body)
    json_response = json_response["data"]["samplesList"]

    expect(json_response["samples"].length).to eq(1)
    expect(json_response).to include_json({
                                            "samples" => [
                                              {
                                                "name" => "Mosquito Sample",
                                                "details" => {
                                                  "metadata" => {
                                                    "collectionDate" => "2019-01-01",
                                                  },
                                                },
                                              },
                                            ],
                                          })
  end

  it "for human samples, truncates date metadata to month" do
    project = create(:project, users: [@joe])
    create(:sample, name: "Human Sample", project: project, user: @joe, host_genome_name: "Human", metadata_fields: { collection_date: "2019-01" })

    post "/graphql", headers: { "Content-Type" => "application/json" }, params: {
      query: query,
      context: { current_user: @joe },
      variables: { projectId: project.id },
    }.to_json

    json_response = JSON.parse(response.body)
    json_response = json_response["data"]["samplesList"]

    expect(json_response["samples"].length).to eq(1)
    expect(json_response).to include_json({
                                            "samples": [
                                              {
                                                "name" => "Human Sample",
                                                "details" => {
                                                  "metadata" => {
                                                    "collectionDate" => "2019-01",
                                                  },
                                                },
                                              },
                                            ],
                                          })
  end
end
