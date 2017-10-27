module PipelineOutputsHelper
  Client = Aws::S3::Client.new

  def get_taxid_fasta(pipeline_output, taxid, tax_level, hit_type)
    uri = pipeline_output.sample.s3_paths_for_taxon_byteranges[tax_level][hit_type]
    uri_parts = uri.split("/", 4)
    bucket = uri_parts[2]
    key = uri_parts[3]
    taxon_location = pipeline_output.taxon_byteranges.find_by(taxid: taxid, hit_type: hit_type)
    if taxon_location.nil? && hit_type == 'NT' && tax_level == TaxonCount::TAX_LEVEL_SPECIES
      taxon_location = pipeline_output.taxon_byteranges.find_by(taxid: taxid, hit_type: nil, tax_level: nil)
      # for backwards-compatibility
    end
    return 'No records' if taxon_location.nil?
    resp = Client.get_object(bucket: bucket, key: key, range: "bytes=#{taxon_location.first_byte}-#{taxon_location.last_byte}")
    resp.body.read
  end
end
