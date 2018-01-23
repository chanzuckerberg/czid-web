module PipelineOutputsHelper
  Client = Aws::S3::Client.new

  def get_taxid_fasta(sample, taxid, tax_level, hit_type)
    uri = sample.s3_paths_for_taxon_byteranges[tax_level][hit_type]
    # e.g. "s3://czbiohub-idseq-samples-development/samples/8/74/postprocess/taxid_annot_sorted_genus_nt.fasta"
    uri_parts = uri.split("/", 4)
    bucket = uri_parts[2]
    key = uri_parts[3]
    pipeline_run = sample.pipeline_runs.first
    taxon_location = pipeline_run.taxon_byteranges.find_by(taxid: taxid, hit_type: hit_type) if pipeline_run
    return '' if taxon_location.nil?
    resp = Client.get_object(bucket: bucket, key: key, range: "bytes=#{taxon_location.first_byte}-#{taxon_location.last_byte}")
    resp.body.read
  end

  def get_s3_file(s3_path)
    uri_parts = s3_path.split("/", 4)
    bucket = uri_parts[2]
    key = uri_parts[3]
    begin
      resp = Client.get_object(bucket: bucket, key: key)
      return resp.body.read
    rescue
      return nil
    end
  end
end
