require 'rails_helper'

RSpec.describe SampleEntityCreationService do
  let(:user) { create(:joe) }
  let(:project) { create(:project, users: [user]) }
  let(:sample) { create(:sample, user: user, project: project) }
  let(:workflow_run) { create(:workflow_run, sample: sample) }

  let(:mock_token) { "mock_token" }

  before do
    allow(TokenCreationService).to receive(:call).and_return(JSON.parse({ token: mock_token }.to_json))
  end

  describe '#call' do
    let(:queried_sample_uuid) { "sample_uuid" }
    let(:get_sample_response) do
      graphql_response_obj(data: {
                             "samples": [{ "id": queried_sample_uuid }],
                           })
    end

    let(:default_sample_uuid) { "sample_uuid" }
    let(:create_sample_response) do
      graphql_response_obj(data: {
                             "create_sample": { "id": default_sample_uuid },
                           })
    end

    let(:sequencing_read_uuid) { nil }
    let(:get_sequencing_read_response) do
      graphql_response_obj(data: {
                             "sequencing_reads": [{ "id": sequencing_read_uuid }],
                           })
    end

    let(:taxon_uuid) { "taxon_uuid" }
    let(:get_taxon_by_upstream_database_identifer_response) do
      graphql_response_obj(data: { "taxa": [{ "id": taxon_uuid }] })
    end

    let(:default_sequencing_read_uuid) { "sequencing_read_uuid" }
    let(:create_sequencing_read_response) do
      graphql_response_obj(data: { "create_sequencing_read": { "id": default_sequencing_read_uuid } })
    end

    let(:workflow_version_uuid) { "workflow_version_uuid" }
    let(:get_workflow_version_response) do
      graphql_response_obj(data: { "workflow_versions": [{ "id": workflow_version_uuid }] })
    end

    let(:created_workflow_run_uuid) { "workflow_run_uuid" }
    let(:create_workflow_run_response) do
      graphql_response_obj(data: { "create_workflow_run": { "id": created_workflow_run_uuid } })
    end

    #  reference_genome_id = response.data.create_reference_genome.id

    let(:wdl_version) { "3.5.1" }

    let(:service) { described_class.new(user.id, sample, workflow_run) }

    let(:expected_entity_inputs) do
      [
        { name: "sample", entityId: default_sample_uuid, entityType: "sample" },
        { name: "sequencing_read", entityId: default_sequencing_read_uuid, entityType: "sequencing_read" },
      ]
    end

    let(:raw_inputs_json) do
      JSON.dump({
                  sars_cov_2: false,
                  ncbi_index_version: workflow_run.inputs&.[]("alignment_config_name") || AlignmentConfig.default_name,
                  creation_source: ConsensusGenomeWorkflowRun::CREATION_SOURCE[:mngs_report],
                })
    end

    before do
      # These query expectations are common to all branches of the service
      # These expectations are here so that they are not repeated in multiple contexts / tests

      expect(CzidGraphqlFederation).to receive(:query_with_token).with(
        user.id,
        GraphqlOperations::GetSampleQuery,
        variables: {
          sample_name: sample.name,
          collection_id: sample.project_id,
          sample_id: sample.id,
        },
        token: mock_token
      ).once.and_return(get_sample_response)

      expect(CzidGraphqlFederation).to receive(:query_with_token).with(
        user.id,
        GraphqlOperations::GetSequencingReadQuery,
        variables: {
          sample_id: sample.id,
        },
        token: mock_token
      ).once.and_return(get_sequencing_read_response)

      allow(VersionRetrievalService).to receive(:call).and_return(wdl_version)
      expect(CzidGraphqlFederation).to receive(:query_with_token).with(
        user.id,
        GraphqlOperations::GetWorkflowVersion,
        variables: {
          workflow_name: workflow_run.workflow,
          version: wdl_version,
        },
        token: mock_token
      ).once.and_return(get_workflow_version_response)

      #   allow(CzidGraphqlFederation).to receive(:query_with_token).with(
      #     user.id,
      #     GraphqlOperations::CreateReferenceGenomeMutation,
      #     variables: {
      #       name: instance_of(String),
      #       collection_id: sample.project_id,
      #     },
      #     token: mock_token,
      #   ).and_return(:create_reference_genome_response)

      expect(CzidGraphqlFederation).to receive(:query_with_token).with(
        user.id,
        GraphqlOperations::CreateWorkflowRun,
        variables: {
          collectionId: sample.project_id,
          workflowVersionId: workflow_version_uuid,
          railsWorkflowRunId: workflow_run.id,
          entityInputs: expected_entity_inputs,
          rawInputJson: raw_inputs_json,
        },
        token: mock_token
      ).once.and_return(create_workflow_run_response)
    end

    # User flow scenarios that fall into this path:
    # 1. Not a SARS-Cov-2 upload
    # 2. Viral consensus genome upload without a known taxon specified
    # 3. Consensus genome run kicked off from mNGS report
    context "taxon_id is not present in the workflow run inputs" do
      before do
        # Sequencing Read mutation without taxon_id
        expect(CzidGraphqlFederation).to receive(:query_with_token).with(
          user.id,
          GraphqlOperations::CreateSequencingReadMutation,
          variables: {
            technology: workflow_run.get_input("technology"),
            clearlabs_export: workflow_run.get_input("clearlabs") | false,
            collection_id: sample.project_id,
            medaka_model: workflow_run.get_input("medaka_model"),
            protocol: workflow_run.get_input("medaka_model"),
            sample_id: default_sample_uuid,
          },
          token: mock_token
        ).once.and_return(create_sequencing_read_response)
      end

      context "default required entity and raw inputs only" do
        context "sample exists in nextgen" do
          it "performs queries to create necessary data objects in the entities and workflows services" do
            service.call
          end
        end

        # This tests logic around creating a sample in nextgen if it does not exist
        # This can happen in other scenarios in this service, but it is not necesary to
        # repeated this test in every context
        context "sample does not exist in nextgen" do
          let(:queried_sample_uuid) { nil }

          it 'creates the necessary entities and workflow run' do
            expect(CzidGraphqlFederation).to receive(:query_with_token).with(
              user.id,
              GraphqlOperations::CreateSampleMutation,
              variables: {
                sample_name: sample.name,
                collection_id: sample.project_id,
                rails_sample_id: sample.id,
              },
              token: mock_token
            ).once.and_return(create_sample_response)

            service.call
          end
        end
      end
    end

    context "when a taxon ID is present in the workflow run inputs" do
      let(:workflow_run) do
        create(
          :workflow_run,
          sample: sample,
          inputs_json: { taxon_id: 123, taxon_name: "fake taxon 1" }.to_json
        )
      end

      let(:expected_entity_inputs) do
        [
          { name: "sample", entityId: default_sample_uuid, entityType: "sample" },
          { name: "sequencing_read", entityId: default_sequencing_read_uuid, entityType: "sequencing_read" },
          { name: "taxon", entityId: taxon_uuid, entityType: "taxon" },
        ]
      end

      let(:raw_inputs_json) do
        JSON.dump({
                    sars_cov_2: false,
                    ncbi_index_version: workflow_run.inputs&.[]("alignment_config_name") || AlignmentConfig.default_name,
                    creation_source: ConsensusGenomeWorkflowRun::CREATION_SOURCE[:mngs_report],
                    taxon_name: nil,
                    taxon_level: nil,
                  })
      end

      it "queries for the taxon from the entities service and uses it to create the sequencing read" do
        expect(CzidGraphqlFederation).to receive(:query_with_token).with(
          user.id,
          GraphqlOperations::GetTaxonByUpstreamDatabaseIdentifier,
          variables: {
            upstream_database_identifier: workflow_run.get_input("taxon_id").to_s,
          },
          token: mock_token
        ).once.and_return(get_taxon_by_upstream_database_identifer_response)

        expect(CzidGraphqlFederation).to receive(:query_with_token).with(
          user.id,
          GraphqlOperations::CreateSequencingReadLinkedToTaxonMutation,
          variables: {
            technology: workflow_run.get_input("technology"),
            clearlabs_export: workflow_run.get_input("clearlabs") | false,
            collection_id: sample.project_id,
            medaka_model: workflow_run.get_input("medaka_model"),
            protocol: workflow_run.get_input("medaka_model"),
            sample_id: queried_sample_uuid,
            taxon_id: taxon_uuid,
          },
          token: mock_token
        ).once.and_return(create_sequencing_read_response)

        service.call
      end

      # TODO: add specs for additional entity inputs
      # possibilities are reference_genome, tax, and accession
    end
  end
end
