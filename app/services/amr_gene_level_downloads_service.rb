class AmrGeneLevelDownloadsService
  include Callable
  include PipelineOutputsHelper

  DOWNLOAD_TYPE_READS = "reads".freeze
  DOWNLOAD_TYPE_CONTIGS = "contigs".freeze

  def initialize(workflow_run, download_type, gene_id)
    @workflow_run = workflow_run
    @download_type = download_type
    @gene_id = gene_id
  end

  def call
    return generate
  end

  private

  def generate
    if @download_type == DOWNLOAD_TYPE_CONTIGS
      raise "Not implemented"
    elsif @download_type == DOWNLOAD_TYPE_READS
      s3_path_bam = @workflow_run.output_path(AmrWorkflowRun::OUTPUT_READS_BAM)
      s3_path_bai = @workflow_run.output_path(AmrWorkflowRun::OUTPUT_READS_BAI)

      # Download .bai index, otherwise samtools downloads/overwrites .bai from other requests
      path_bai = Tempfile.new().path
      bucket, key = S3Util.parse_s3_path(s3_path_bai)
      AwsClient[:s3].get_object(bucket: bucket, key: key, response_target: path_bai)

      # Create a signed URL; we would need "~/.aws/credentials" for this to work with S3 paths
      url_bam = get_presigned_s3_url(s3_path: s3_path_bam)

      # Fetch reads from S3
      path_output = Tempfile.new().path
      Syscall.pipe_with_output(
        # Fetch reads from the BAM file
        ["samtools", "view", "-h", "-X", url_bam, path_bai, @gene_id],
        # Convert to FASTA format
        "samtools fasta > #{path_output}"
      )

      path_output
    end
  end
end
