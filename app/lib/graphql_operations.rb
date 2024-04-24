class GraphqlOperations
  ############### Operations for SampleEntityCreationService ###############
  GetSampleQuery = CzidGraphqlFederation::Client.parse <<-'GRAPHQL'
    query($sample_id: Int!) {
      samples(where: {railsSampleId: {_eq: $sample_id}}) {
        id
      }
    }
  GRAPHQL

  CreateSampleMutation = CzidGraphqlFederation::Client.parse <<-'GRAPHQL'
    mutation($sample_name: String!, $collection_id: Int!, $rails_sample_id: Int!) {
      createSample(
        input: {
          name: $sample_name,
          collectionId: $collection_id,
          railsSampleId: $rails_sample_id,
        }
      ) {
        id
      }
    }
  GRAPHQL

  # Also used in SampleFileEntityLinkCreationService
  #
  # TODO: This query will need to be updated to enable support for associating
  # multiple sequencing reads with a sample.
  GetSequencingReadQuery = CzidGraphqlFederation::Client.parse <<-'GRAPHQL'
    query($sample_id: Int!) {
      sequencingReads(where: {sample: {railsSampleId: {_eq: $sample_id}}}) {
        id
      }
    }
  GRAPHQL

  CreateSequencingReadMutation = CzidGraphqlFederation::Client.parse <<-'GRAPHQL'
    mutation($technology: SequencingTechnology!, $clearlabs_export: Boolean!, $collection_id: Int!, $medaka_model: String, $protocol: SequencingProtocol, $sample_id: ID!) {
      createSequencingRead(
        input: {
          technology: $technology,
          clearlabsExport: $clearlabs_export,
          collectionId: $collection_id,
          medakaModel: $medaka_model,
          protocol: $protocol,
          sampleId: $sample_id,
        }
      ) {
        id
      }
    }
  GRAPHQL

  CreateSequencingReadLinkedToTaxonMutation = CzidGraphqlFederation::Client.parse <<-'GRAPHQL'
  mutation($technology: SequencingTechnology!, $clearlabs_export: Boolean!, $collection_id: Int!, $medaka_model: String, $protocol: SequencingProtocol, $sample_id: ID!, $taxon_id: ID!) {
    createSequencingRead(
      input: {
        technology: $technology,
        clearlabsExport: $clearlabs_export,
        collectionId: $collection_id,
        medakaModel: $medaka_model,
        protocol: $protocol,
        sampleId: $sample_id,
        taxonId: $taxon_id,
      }
    ) {
      id
    }
  }
  GRAPHQL

  GetWorkflowVersion = CzidGraphqlFederation::Client.parse <<-'GRAPHQL'
    query($workflow_name: String!, $version: String!) {
      workflowVersions(
        where: {workflow: {name: {_eq: $workflow_name}}, version: {_eq: $version}}
      ) {
        id
      }
    }
  GRAPHQL

  CreateReferenceGenomeMutation = CzidGraphqlFederation::Client.parse <<-'GRAPHQL'
        mutation($name: String!, $collection_id: Int!) {
            createReferenceGenome(input: {name: $name, collectionId: $collection_id}) {
                id
            }
        }
  GRAPHQL

  GetTaxonByUpstreamDatabaseIdentifier = CzidGraphqlFederation::Client.parse <<-'GRAPHQL'
  query($upstream_database_identifier: String!) {
    taxa(where: {upstreamDatabaseIdentifier: {_eq: $upstream_database_identifier}}) {
      id
      name
      level
    }
  }
  GRAPHQL

  GetAccessionId = CzidGraphqlFederation::Client.parse <<-'GRAPHQL'
    query($accession_id: String!) {
      accessions(where: {upstreamDatabase: {name: {_eq: "NCBI"}}, accessionId: {_eq: $accession_id}}) {
        id
      }
    }
  GRAPHQL

  CreateWorkflowRun = CzidGraphqlFederation::Client.parse <<-'GRAPHQL'
    mutation($collectionId: Int!, $workflowVersionId: ID!, $railsWorkflowRunId: Int!, $rawInputJson: String!, $entityInputs: [EntityInputType!]!) {
      createWorkflowRun(
        input: {
          collectionId: $collectionId,
          workflowVersionId: $workflowVersionId,
          entityInputs: $entityInputs,
          rawInputJson: $rawInputJson,
          railsWorkflowRunId: $railsWorkflowRunId,
        }
      ) {
        id
      }
    }
  GRAPHQL

  ############### Operations for SampleFileEntityLinkCreationService ###############
  FetchWorkflowRun = CzidGraphqlFederation::Client.parse <<-'GRAPHQL'
    query($workflow_run_id: Int!) {
      workflowRuns(where: {railsWorkflowRunId: {_eq: $workflow_run_id}}) {
        id
        entityInputs(where: {entityType: {_eq: "reference_genome"}}) {
          edges {
            node {
              inputEntityId
              entityType
            }
          }
        }
      }
    }
  GRAPHQL

  CreateLinkedFileMutation = CzidGraphqlFederation::Client.parse <<-'GRAPHQL'
    mutation($entity_id: ID!, $field_name: String!, $file_name: String!, $protocol: FileAccessProtocol!, $file_path: String!, $file_type: String!, $namespace: String!) {
      createFile(
        entityFieldName: $field_name
        entityId: $entity_id
        file: {
          name: $file_name,
          protocol: $protocol,
          namespace: $namespace,
          path: $file_path,
          fileFormat: $file_type
        }
      ) {
        id
      }
    }
  GRAPHQL

  CreateGenomicRangeMutation = CzidGraphqlFederation::Client.parse <<-'GRAPHQL'
    mutation($collection_id: Int!) {
      createGenomicRange(input: {collectionId: $collection_id}) {
        id
      }
    }
  GRAPHQL

  LinkGenomicRangeMutation = CzidGraphqlFederation::Client.parse <<-'GRAPHQL'
    mutation($primer_file_id: ID!, $sequencing_read_id: UUID!) {
      updateSequencingRead(input: {primerFileId: $primer_file_id}, where: {id: {_eq: $sequencing_read_id}}) {
        id
      }
    }
  GRAPHQL

  KickoffWorkflowRun = CzidGraphqlFederation::Client.parse <<-'GRAPHQL'
    mutation($workflow_run_id: ID!, $execution_id: String) {
      runWorkflowRun(workflowRunId: $workflow_run_id, executionId: $execution_id) {
        id
      }
    }
  GRAPHQL

  ############### Operations for WorkflowRunRerunService ###############
  GetWorkflowRunForRerun = CzidGraphqlFederation::Client.parse <<-'GRAPHQL'
    query($workflow_run_id: UUID!) {
      workflowRuns(where: {id: {_eq: $workflow_run_id}}) {
        id
        ownerUserId
        collectionId
        rawInputsJson
        railsWorkflowRunId
        workflowVersion {
          id
        }
        entityInputs {
          edges {
            node {
              entityType
              inputEntityId
              fieldName
            }
          }
        }
      }
    }
  GRAPHQL

  DeprecateWorkflowRun = CzidGraphqlFederation::Client.parse <<-'GRAPHQL'
    mutation($old_workflow_run_id: UUID!, $new_workflow_run_id: ID!) {
      updateWorkflowRun(input: {deprecatedById: $new_workflow_run_id}, where: {id: {_eq: $old_workflow_run_id}}) {
        id
      }
    }
  GRAPHQL
end
