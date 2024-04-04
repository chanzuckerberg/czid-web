class SampleEntityCreationService
  include Callable
  include ParameterSanitization

  NEXT_GEN_SEQUENCING_TECHNOLOGY_MAP = {
    "Illumina" => "Illumina",
    "ONT" => "Nanopore",
  }.freeze

  def initialize(user_id, sample, workflow_run)
    @user_id = user_id
    @sample = sample
    @workflow_run = workflow_run
    @workflow_run_accession_name = @workflow_run.inputs&.[]("accession_name")
    @technology = NEXT_GEN_SEQUENCING_TECHNOLOGY_MAP[@workflow_run.get_input("technology")]
    @token = TokenCreationService
             .call(
               user_id: @user_id,
               should_include_project_claims: true,
               service_identity: "rails"
             )["token"]
  end

  def call
    # Check if the Sample already exists in the nextGen database
    response = CzidGraphqlFederation
               .query_with_token(
                 @user_id,
                 GraphqlOperations::GetSampleQuery,
                 variables: {
                   sample_name: @sample.name,
                   collection_id: @sample.project_id,
                   sample_id: @sample.id,
                 },
                 token: @token
               )
    nextgen_sample_id = response.data&.samples&.first&.id
    if nextgen_sample_id.nil?
      # Create the new Sample
      response = CzidGraphqlFederation
                 .query_with_token(
                   @user_id,
                   GraphqlOperations::CreateSampleMutation,
                   variables: {
                     sample_name: @sample.name,
                     collection_id: @sample.project_id,
                     rails_sample_id: @sample.id,
                   },
                   token: @token
                 )
      nextgen_sample_id = response.data&.create_sample&.id
    end

    # Check if the SequencingRead already exists in the nextGen database
    response = CzidGraphqlFederation
               .query_with_token(
                 @user_id,
                 GraphqlOperations::GetSequencingReadQuery,
                 variables: {
                   sample_id: @sample.id,
                 },
                 token: @token
               )
    sequencing_read_id = response.data&.sequencing_reads&.first&.id
    if sequencing_read_id.nil?
      # Create the new SequencingRead and link it to the Sample
      response = CzidGraphqlFederation
                 .query_with_token(
                   @user_id,
                   GraphqlOperations::CreateSequencingReadMutation,
                   variables: {
                     technology: @technology,
                     clearlabs_export: @workflow_run.get_input("clearlabs") | false,
                     collection_id: @sample.project_id,
                     medaka_model: @workflow_run.get_input("medaka_model"),
                     protocol: @workflow_run.get_input("wetlab_protocol"),
                     sample_id: nextgen_sample_id,
                   },
                   token: @token
                 )
      sequencing_read_id = response.data&.create_sequencing_read&.id
    end

    # Get the workflow version id
    wdl_version = VersionRetrievalService.call(@sample.project_id, @workflow_run.workflow)
    response = CzidGraphqlFederation
               .query_with_token(
                 @user_id,
                 GraphqlOperations::GetWorkflowVersion,
                 variables: {
                   workflow_name: @workflow_run.workflow,
                   version: wdl_version,
                 },
                 token: @token
               )
    workflow_version_id = response.data&.workflow_versions&.first&.id

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
        response = CzidGraphqlFederation
                   .query_with_token(
                     @user_id,
                     GraphqlOperations::CreateReferenceGenomeMutation,
                     variables: {
                       name: reference_sequence.name,
                       collection_id: @sample.project_id,
                     },
                     token: @token
                   )
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
        response = CzidGraphqlFederation
                   .query_with_token(
                     @user_id,
                     GraphqlOperations::GetTaxonByUpstreamDatabaseIdentifier,
                     variables: {
                       upstream_database_identifier: @workflow_run.get_input("taxon_id").to_s,
                     },
                     token: @token
                   )
        next_gen_taxon_id = response.data&.taxa&.first&.id
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
                                   GraphqlOperations::GetAccessionId,
                                   variables: {
                                     accession_id: workflow_run_accession_id,
                                   },
                                   token: @token
                                 )
        next_gen_accession_id = get_accession_response.data.accessions.first&.id
        create_workflow_run_entity_inputs.push(
          {
            name: "accession",
            entityId: next_gen_accession_id,
            entityType: "accession",
          }
        )
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
                 GraphqlOperations::CreateWorkflowRun,
                 variables: {
                   collectionId: @sample.project_id,
                   workflowVersionId: workflow_version_id,
                   railsWorkflowRunId: @workflow_run.id,
                   entityInputs: create_workflow_run_entity_inputs,
                   rawInputJson: JSON.dump(create_workflow_run_raw_inputs_hash),
                 },
                 token: @token
               )
    next_gen_workflow_run_id = response.data&.create_workflow_run&.id
    next_gen_workflow_run_id
  end

  private

  def workflow_run_accession_id
    if creation_source == ConsensusGenomeWorkflowRun::CREATION_SOURCE[:viral_cg_upload]
      return sanitize_accession_id(@workflow_run.inputs&.[]("reference_accession"))
    else
      return sanitize_accession_id(@workflow_run.inputs&.[]("accession_id"))
    end
  end

  def workflow_run_technology
    @workflow_run.get_input("technology")
  end

  def workflow_run_technology_illumina?
    workflow_run_technology == ConsensusGenomeWorkflowRun::TECHNOLOGY_INPUT[:illumina]
  end

  def creation_source
    if @workflow_run.inputs&.[]("ref_fasta")
      return ConsensusGenomeWorkflowRun::CREATION_SOURCE[:viral_cg_upload]
    elsif workflow_run_is_sars_cov_2?
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
end
