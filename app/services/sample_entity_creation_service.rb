class SampleEntityCreationService
  include Callable
  include ParameterSanitization

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

  CreateReferenceGenomeMutation = CzidGraphqlFederation::Client.parse <<-'GRAPHQL'
        mutation($name: String!, $collection_id: Int!) {
            createReferenceGenome(input: {name: $name, collectionId: $collection_id}) {
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

  GetTaxonByUpstreamDatabaseIdentifier = CzidGraphqlFederation::Client.parse <<-'GRAPHQL'
  query($upstream_database_identifier: String!) {
    taxa(where: {upstreamDatabaseIdentifier: {_eq: $upstream_database_identifier}}) {
      id
    }
  }
  GRAPHQL

  GetAccessionId = CzidGraphqlFederation::Client.parse <<-'GRAPHQL'
  query($accession_id: String!) {
    accessions(where: { accessionId: { _eq: $accession_id } } ) {
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

  NEXT_GEN_SEQUENCING_TECHNOLOGY_MAP = {
    "Illumina" => "Illumina",
    "ONT" => "Nanopore",
  }.freeze

  def initialize(user_id, sample, workflow_run)
    @user_id = user_id
    @sample = sample
    @workflow_run = workflow_run
  end

  def call
    # Create the new Sample
    response = CzidGraphqlFederation
               .query_with_token(
                 @user_id,
                 CreateSampleMutation,
                 variables: {
                   sample_name: @sample.name,
                   collection_id: @sample.project_id,
                   rails_sample_id: @sample.id,
                 }
               )
    nextgen_sample_id = response.data.create_sample.id

    # Create the new SequencingRead and link it to the Sample
    response = CzidGraphqlFederation
               .query_with_token(
                 @user_id,
                 CreateSequencingReadMutation,
                 variables: {
                   technology: NEXT_GEN_SEQUENCING_TECHNOLOGY_MAP[workflow_run_technology],
                   clearlabs_export: @workflow_run.get_input("clearlabs") | false,
                   collection_id: @sample.project_id,
                   medaka_model: @workflow_run.get_input("medaka_model"),
                   protocol: @workflow_run.get_input("wetlab_protocol"),
                   sample_id: nextgen_sample_id,
                 }
               )
    sequencing_read_id = response.data.create_sequencing_read.id

    # Get the workflow version id
    wdl_version = VersionRetrievalService.call(@sample.project_id, @workflow_run.workflow)
    response = CzidGraphqlFederation
               .query_with_token(
                 @user_id,
                 GetWorkflowVersion,
                 variables: {
                   workflow_name: @workflow_run.workflow,
                   version: wdl_version,
                 }
               )
    workflow_version_id = response.data.workflow_versions.first.id

    # Assemble entity inputs
    create_workflow_run_entity_inputs = [
      { name: "sample",
        entityId: nextgen_sample_id,
        entityType: "sample", },
      { name: "sequencing_read",
        entityId: sequencing_read_id,
        entityType: "sequencing_read", },
    ]

    unless workflow_run_is_sars_cov_2?
      # Add reference genome (if present) to workflow run entity inputs
      reference_sequence = @sample.input_files.where(file_type: InputFile::FILE_TYPE_REFERENCE_SEQUENCE).first
      if reference_sequence.present?
        response = CzidGraphqlFederation.query_with_token(@user_id, CreateReferenceGenomeMutation, variables: { name: reference_sequence.name, collection_id: @sample.project_id })
        reference_genome_id = response.data.create_reference_genome.id
        create_workflow_run_entity_inputs.push(
          {
            name: "reference_genome",
            entityId: reference_genome_id,
            entityType: "reference_genome",
          }
        )
      end

      # Add next gen taxon entity (if present) to workflow run entity inputs
      workflow_run_taxon_id = @workflow_run.get_input("taxon_id")
      if workflow_run_taxon_id
        response = CzidGraphqlFederation.query_with_token(@user_id, GetTaxonByUpstreamDatabaseIdentifier, variables: { upstream_database_identifier: @workflow_run.get_input("taxon_id").to_s })
        next_gen_taxon_id = response.data.taxa.first&.id
        if next_gen_taxon_id
          create_workflow_run_entity_inputs.push(
            {
              name: "taxon",
              entityId: next_gen_taxon_id,
              entityType: "taxon",
            }
          )
        end
      end

      # Add next gen accession entity (if present) to workflow run entity inputs
      if workflow_run_accession_id
        get_accession_response = CzidGraphqlFederation
                                 .query_with_token(
                                   @user_id,
                                   GetAccessionId,
                                   variables: {
                                     accession_id: workflow_run_accession_id,
                                   }
                                 )
        next_gen_accession_id = get_accession_response.data.accessions.first&.id
        if next_gen_accession_id
          create_workflow_run_entity_inputs.push(
            {
              name: "accession",
              entityId: next_gen_accession_id,
              entityType: "accession",
            }
          )
        end
      end
    end

    # Assemble raw inputs
    create_workflow_run_raw_inputs_hash = {
      sars_cov_2: workflow_run_is_sars_cov_2?,
      ncbi_index_version: workflow_run_ncbi_version,
      creation_source: creation_source,
    }

    # Create the new workflow run
    response = CzidGraphqlFederation
               .query_with_token(
                 @user_id,
                 CreateWorkflowRun,
                 variables: {
                   collectionId: @sample.project_id,
                   workflowVersionId: workflow_version_id,
                   railsWorkflowRunId: @workflow_run.id,
                   entityInputs: create_workflow_run_entity_inputs,
                   rawInputJson: JSON.dump(create_workflow_run_raw_inputs_hash),
                 }
               )
    next_gen_workflow_run_id = response.data.create_workflow_run.id
    next_gen_workflow_run_id
  end
end

def workflow_run_accession_id
  if workflow_run_is_sars_cov_2?
    @workflow_run.inputs&.[]("accession_id")
  elsif creation_source == ConsensusGenomeWorkflowRun::CREATION_SOURCE[:viral_cg_upload] && workflow_run_technology_illumina?
    @workflow_run.inputs&.[]("reference_accession")
  elsif creation_source == ConsensusGenomeWorkflowRun::CREATION_SOURCE[:mngs_report] && workflow_run_technology_illumina?
    sanitize_accession_id(@workflow_run.inputs&.[]("accession_id"))
  end
  nil
end

def workflow_run_technology
  @workflow_run.get_input("technology")
end

def workflow_run_technology_illumina?
  workflow_run_technology == ConsensusGenomeWorkflowRun::TECHNOLOGY_INPUT[:illumina]
end

def creation_source
  ref_fasta_input = @workflow_run.sample.input_files.reference_sequence

  if workflow_run_technology == ConsensusGenomeWorkflowRun::TECHNOLOGY_INPUT[:nanopore]
    # CG kickoff is not available through mNGS nanopore report
    return ConsensusGenomeWorkflowRun::CREATION_SOURCE[:sars_cov_2_upload]
  elsif ref_fasta_input.presence || @workflow_run.inputs&.[]("reference_accession")
    return ConsensusGenomeWorkflowRun::CREATION_SOURCE[:viral_cg_upload]
  elsif @workflow_run.inputs&.[]("accession_id") == ConsensusGenomeWorkflowRun::SARS_COV_2_ACCESSION_ID
    return ConsensusGenomeWorkflowRun::CREATION_SOURCE[:sars_cov_2_upload]
  else
    return ConsensusGenomeWorkflowRun::CREATION_SOURCE[:mngs_report]
  end
end

def workflow_run_ncbi_version
  @workflow_run.inputs&.[]("alignment_config_name") || AlignmentConfig.default_name
end

def workflow_run_is_sars_cov_2?
  @workflow_run.inputs&.[]("accession_id") == ConsensusGenomeWorkflowRun::SARS_COV_2_ACCESSION_ID
end
