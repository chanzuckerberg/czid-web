module PipelineOutputsHelper
  Client = Aws::S3::Client.new

  def get_taxid_fasta(pipeline_output, taxid)
    uri_parts = pipeline_output.sample.sorted_taxid_annotated_fasta_s3_path.split("/", 4)
    bucket = uri_parts[2]
    key = uri_parts[3]
    taxon_location = pipeline_output.taxon_byteranges.find_by(taxid: taxid)
    return 'No records' if taxon_location.nil?
    resp = Client.get_object(bucket: bucket, key: key, range: "bytes=#{taxon_location.first_byte}-#{taxon_location.last_byte}")
    resp.body.read
  end

  def get_s3_file(s3_path)
    uri_parts = s3_path.split("/", 4)
    bucket = uri_parts[2]
    key = uri_parts[3]
    resp = Client.get_object(bucket: bucket, key: key)
    resp.body.read
  end
end
