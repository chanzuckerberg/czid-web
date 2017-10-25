module PipelineOutputsHelper
  # TO DO: check if ENV variables on instances actually have these names
  # ENV['AWS_REGION'] ||= 'us-west-2'
  # Creds = Aws::Credentials.new(ENV['AWS_ACCESS_KEY'], ENV['AWS_ACCESS_SECRET'])
  # Client = Aws::S3::Client.new(region: ENV['AWS_REGION'], credentials: Creds)
  Client = Aws::S3::Client.new()

  def get_taxid_fasta(pipeline_output, taxid)
    uri_parts = pipeline_output.sample.sorted_taxid_annotated_fasta_s3_path.split("/", 4)
    bucket = uri_parts[2]
    key = uri_parts[3]
    taxon_location = pipeline_output.taxon_byteranges.find_by(taxid: taxid)
    resp = Client.get_object(bucket: bucket, key: key, range: "bytes=#{taxon_location.first_byte}-#{taxon_location.last_byte}")
    resp.body.read
  end
end
