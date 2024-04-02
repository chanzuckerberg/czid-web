class SampleFileEntityLinkCreationService
  include Callable

  NEXT_GEN_FILE_FORMAT_MAP = {
    "fastq" => "fastq",
    "fasta" => "fasta",
    "primer_bed" => "bed",
    "json" => "json",
  }.freeze

  def initialize(user_id, sample)
    @user_id = user_id
    @sample = sample
    @workflow_run = @sample.workflow_runs.last
    @token = TokenCreationService
             .call(
               user_id: @user_id,
               should_include_project_claims: true,
               service_identity: "rails"
             )["token"]
  end

  def call
    # Get the nextGen workflow run info
    response = CzidGraphqlFederation
               .query_with_token(
                 @user_id,
                 GraphqlOperations::FetchWorkflowRun,
                 variables: {
                   workflow_run_id: @workflow_run.id,
                 },
                 token: @token
               )

    # Store workflow run ID for kicking off workflow
    next_gen_workflow_run_id = response.data.workflow_runs.first.id

    # Store reference genome to link file to sequencing read
    workflow_run_entity_inputs = response.data.workflow_runs.first.entity_inputs.edges
    is_reference_genome_input = workflow_run_entity_inputs.present? && workflow_run_entity_inputs.first.node.entity_type == "reference_genome"
    workflow_run_reference_genome_id = is_reference_genome_input ? workflow_run_entity_inputs.first.node.input_entity_id : nil

    # Get the SequencingRead ID so we can link the files to it
    response = CzidGraphqlFederation
               .query_with_token(
                 @user_id,
                 GraphqlOperations::GetSequencingReadQuery,
                 variables: {
                   sample_id: @sample.id,
                 },
                 token: @token
               )
    sequencing_read_id = response.data.sequencing_reads.first.id

    # Create the r1 and r2 files, link them to SequencingRead
    input_fastqs = @sample.input_files.where(file_type: InputFile::FILE_TYPE_FASTQ).sort_by(&:name)
    call_create_linked_file_mutation(
      entity_id: sequencing_read_id,
      field_name: "r1_file",
      file_name: input_fastqs[0].name,
      protocol: "s3",
      file_path: input_fastqs[0].file_path,
      file_type: input_fastqs[0].file_type,
      namespace: ENV["SAMPLES_BUCKET_NAME"]
    )

    if input_fastqs.length > 1
      call_create_linked_file_mutation(
        entity_id: sequencing_read_id,
        field_name: "r2_file",
        file_name: input_fastqs[1].name,
        protocol: "s3",
        file_path: input_fastqs[1].file_path,
        file_type: input_fastqs[1].file_type,
        namespace: ENV["SAMPLES_BUCKET_NAME"]
      )
    end

    # When there is a primer bed, create GenomicRange and link to appropriate entities
    primer_bed = @sample.input_files.where(file_type: InputFile::FILE_TYPE_PRIMER_BED).first
    if primer_bed.present?
      response = CzidGraphqlFederation
                 .query_with_token(
                   @user_id,
                   GraphqlOperations::CreateGenomicRangeMutation,
                   variables: {
                     collection_id: @sample.project_id,
                   },
                   token: @token
                 )
      genomic_range_id = response.data.create_genomic_range.id

      # Link the GenomicRange to the primer bed file
      call_create_linked_file_mutation(
        entity_id: genomic_range_id,
        field_name: "file",
        file_name: primer_bed.name,
        protocol: "s3",
        file_path: primer_bed.file_path,
        file_type: NEXT_GEN_FILE_FORMAT_MAP[primer_bed.file_type],
        namespace: ENV["SAMPLES_BUCKET_NAME"]
      )

      # Link GenomicRange to SequencingRead
      CzidGraphqlFederation
        .query_with_token(
          @user_id,
          GraphqlOperations::LinkGenomicRangeMutation,
          variables: {
            primer_file_id: genomic_range_id,
            sequencing_read_id: sequencing_read_id,
          },
          token: @token
        )
    end

    # Link reference sequence file to ReferenceGenome
    reference_sequence = @sample.input_files.where(file_type: InputFile::FILE_TYPE_REFERENCE_SEQUENCE).first
    if reference_sequence.present? && workflow_run_reference_genome_id.present?
      call_create_linked_file_mutation(
        entity_id: workflow_run_reference_genome_id,
        field_name: "file",
        file_name: reference_sequence.name,
        protocol: "s3",
        file_path: reference_sequence.file_path,
        file_type: "fastq",
        namespace: ENV["SAMPLES_BUCKET_NAME"]
      )
    end

    # Kick off the workflow run
    CzidGraphqlFederation
      .query_with_token(
        @user_id,
        GraphqlOperations::KickoffWorkflowRun,
        variables: {
          workflow_run_id: next_gen_workflow_run_id,
          execution_id: @workflow_run.sfn_execution_arn,
        },
        token: @token
      )
  end

  private

  def call_create_linked_file_mutation(entity_id:, field_name:, file_name:, protocol:, file_path:, file_type:, namespace:)
    CzidGraphqlFederation
      .query_with_token(
        @user_id,
        GraphqlOperations::CreateLinkedFileMutation,
        variables: {
          entity_id: entity_id,
          field_name: field_name,
          file_name: file_name,
          protocol: protocol,
          file_path: file_path,
          file_type: file_type,
          namespace: namespace,
        },
        token: @token
      )
  end
end
