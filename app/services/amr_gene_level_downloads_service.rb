class AmrGeneLevelDownloadsService
  include Callable
  include PipelineOutputsHelper

  DOWNLOAD_TYPE_READS = "reads".freeze
  DOWNLOAD_TYPE_CONTIGS = "contigs".freeze

  # index id is gene id for reads and ARO accession for contigs
  def initialize(workflow_run, download_type, index_id)
    @workflow_run = workflow_run
    @download_type = download_type
    @index_id = index_id
  end

  def call
    return generate
  end

  private

  def generate
    if @download_type == DOWNLOAD_TYPE_CONTIGS
      output_bam = AmrWorkflowRun::OUTPUT_CONTIGS_BAM
      output_bai = AmrWorkflowRun::OUTPUT_CONTIGS_BAI
    elsif @download_type == DOWNLOAD_TYPE_READS
      output_bam = AmrWorkflowRun::OUTPUT_READS_BAM
      output_bai = AmrWorkflowRun::OUTPUT_READS_BAI
    end

    s3_path_bam = @workflow_run.output_path(output_bam)
    s3_path_bai = @workflow_run.output_path(output_bai)

    # Download .bai index, otherwise samtools downloads/overwrites .bai from other requests
    # The .bai file is small (~50kb) since the .bam files are only 10's of megabytes
    path_bai = Tempfile.new().path
    bucket, key = S3Util.parse_s3_path(s3_path_bai)
    AwsClient[:s3].get_object(bucket: bucket, key: key, response_target: path_bai)

    # Create a signed URL; we would need "~/.aws/credentials" for this to work with S3 paths
    url_bam = get_presigned_s3_url(s3_path: s3_path_bam)

    # Fetch reads from S3
    path_output = Tempfile.new().path
    Syscall.pipe_with_output(
      # Fetch reads from the BAM file
      ["samtools", "view", "-h", "-X", url_bam, path_bai, @index_id],
      # Convert to FASTA format
      "samtools fasta > #{path_output}"
    )

    path_output
  end
end
