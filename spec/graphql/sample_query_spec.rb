require "rails_helper"

RSpec.describe GraphqlController, type: :request do
  create_users

  query = <<GQL
  query GetSample($sampleId: Int!) {
    sample(sampleId: $sampleId) {
      name
      createdAt
      updatedAt
      projectId
      status
      hostGenomeId
      uploadError
      initialWorkflow
      project {
        id
        name
      }
      defaultBackgroundId
      defaultPipelineRunId
      sampleDeletable
      editable
      pipelineRuns {
        id
        pipelineVersion
        createdAt
        alignmentConfigName
        assembled
        adjustedRemainingReads
        totalErccReads
      }
      workflowRuns {
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
      }
    }
  }
GQL

  context "Joe" do
    before do
      sign_in @joe
    end

    describe "GET show" do
      it "can see sample report_v2" do
        project = create(:project, users: [@joe])
        # sample = create(:sample, project: project, host_genome_name: "Mosquito")
        sample = create(:sample, name: "Human Sample", project: project, user: @joe, host_genome_name: "Human", metadata_fields: { collection_date: "2019-01-01" })
        post "/graphql", headers: { 'Content-Type' => 'application/json' }, params: {
          query: query,
          context: { current_user: @joe },
          variables: { sampleId: sample.id },
        }.to_json
        expect(response).to have_http_status :success
      end
    end
  end
end
