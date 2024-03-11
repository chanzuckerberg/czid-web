class SampleFileEntityLinkCreationService
  include Callable

  FetchWorkflowRun = CzidGraphqlFederation::Client.parse <<-'GRAPHQL'
  query($workflow_run_id: Int!) {
    workflowRuns(where: {railsWorkflowRunId: {_eq: $workflow_run_id}}) {
      id
      entityInputs(where: {entityType: {_eq: "reference_genome"}}) {
        edges {
          node {
            id
            entityType
          }
        }
      }
    }
  }
  GRAPHQL

  GetSequencingReadQuery = CzidGraphqlFederation::Client.parse <<-'GRAPHQL'
        query($sample_id: Int!) {
            sequencingReads(where: {sample: {railsSampleId: {_eq: $sample_id}}}) {
                id
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

  def initialize(user_id, sample)
    @user_id = user_id
    @sample = sample
    @workflow_run = @sample.workflow_runs.last
  end

  def call
    # Get the nextGen workflow run info
    response = CzidGraphqlFederation.query_with_token(@user_id, FetchWorkflowRun, variables: { workflow_run_id: @workflow_run.id })

    # Store workflow run ID for kicking off workflow
    next_gen_workflow_run_id = response.data.workflow_runs.first.id

    # Store reference genome to link file to sequencing read
    workflow_run_entity_inputs = response.data.workflow_runs.first.entity_inputs.edges
    is_reference_genome_input = workflow_run_entity_inputs.present? && workflow_run_entity_inputs.first.node.entity_type == "reference_genome"
    workflow_run_reference_genome_id = is_reference_genome_input ? workflow_run_entity_inputs.first.node.id : nil

    # Get the SequencingRead ID so we can link the files to it
    response = CzidGraphqlFederation.query_with_token(@user_id, GetSequencingReadQuery, variables: { sample_id: @sample.id })
    sequencing_read_id = response.data.sequencing_reads.first.id

    # Create the r1 and r2 files, link them to SequencingRead
    input_fastqs = @sample.input_files.where(file_type: InputFile::FILE_TYPE_FASTQ).sort_by(&:name)
    CzidGraphqlFederation.query_with_token(@user_id, CreateLinkedFileMutation, variables: { entity_id: sequencing_read_id, field_name: "r1_file", file_name: input_fastqs[0].name, protocol: "s3", file_path: input_fastqs[0].file_path, file_type: input_fastqs[0].file_type, namespace: ENV["SAMPLES_BUCKET_NAME"] })

    if input_fastqs.length > 1
      CzidGraphqlFederation.query_with_token(@user_id, CreateLinkedFileMutation, variables: { entity_id: sequencing_read_id, field_name: "r2_file", file_name: input_fastqs[1].name, protocol: "s3", file_path: input_fastqs[1].file_path, file_type: input_fastqs[1].file_type, namespace: ENV["SAMPLES_BUCKET_NAME"] })
    end

    # When there is a primer bed, create GenomicRange and link to appropriate entities
    primer_bed = @sample.input_files.where(file_type: InputFile::FILE_TYPE_PRIMER_BED).first
    if primer_bed.present?
      response = CzidGraphqlFederation
                 .query_with_token(
                   @user_id, CreateGenomicRangeMutation,
                   variables: {
                     collection_id: @sample.project_id,
                   }
                 )
      genomic_range_id = response.data.create_genomic_range.id

      # Link the GenomicRange to the primer bed file
      CzidGraphqlFederation
        .query_with_token(
          @user_id,
          CreateLinkedFileMutation,
          variables: {
            entity_id: genomic_range_id,
            field_name: "file",
            file_name: primer_bed.name,
            protocol: "s3",
            file_path: primer_bed.file_path,
            file_type: primer_bed.file_type,
            namespace: ENV["SAMPLES_BUCKET_NAME"],
          }
        )

      # Link GenomicRange to SequencingRead
      CzidGraphqlFederation
        .query_with_token(
          @user_id,
          LinkGenomicRangeMutation,
          variables: {
            primer_file_id: genomic_range_id,
            sequencing_read_id: sequencing_read_id,
          }
        )
    end

    # Create ReferenceGenome, link file to ReferenceGenome
    reference_sequence = @sample.input_files.where(file_type: InputFile::FILE_TYPE_REFERENCE_SEQUENCE).first
    if reference_sequence.present? && workflow_run_reference_genome_id.present?
      CzidGraphqlFederation.query_with_token(@user_id, CreateLinkedFileMutation, variables: { entity_id: workflow_run_reference_genome_id, field_name: "file", file_name: reference_sequence.name, protocol: "s3", file_path: reference_sequence.file_path, file_type: "fastq", namespace: ENV["SAMPLES_BUCKET_NAME"] })
    end

    # Kick off the workflow run
    CzidGraphqlFederation
      .query_with_token(
        @user_id,
        KickoffWorkflowRun,
        variables: {
          workflow_run_id: next_gen_workflow_run_id,
          execution_id: @workflow_run.sfn_execution_arn,
        }
      )
  end
end
