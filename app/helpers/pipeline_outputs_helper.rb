module PipelineOutputsHelper
  Client = Aws::S3::Client.new

  def get_taxid_fasta(pipeline_output, taxid, hit_type)
    hit_type = 'NT' if hit_type.nil?
    if hit_type == 'NT'
      uri = pipeline_output.sample.sorted_taxid_annotated_fasta_s3_path
    elsif hit_type == 'NR'
      uri = pipeline_output.sample.sorted_nr_taxid_annotated_fasta_s3_path
    else
      return ''
    end
    uri_parts = uri.split("/", 4)
    bucket = uri_parts[2]
    key = uri_parts[3]
    taxon_location = pipeline_output.taxon_byteranges.find_by(taxid: taxid, hit_type: hit_type)
    if taxon_location.nil? && hit_type == 'NT'
      taxon_location = pipeline_output.taxon_byteranges.find_by(taxid: taxid, hit_type: nil)
      # for backwards-compatibility
    end
    return 'No records' if taxon_location.nil?
    resp = Client.get_object(bucket: bucket, key: key, range: "bytes=#{taxon_location.first_byte}-#{taxon_location.last_byte}")
    resp.body.read
  end
end
