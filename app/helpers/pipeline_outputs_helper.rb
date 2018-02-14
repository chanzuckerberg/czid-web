module PipelineOutputsHelper
  Client = Aws::S3::Client.new

  def curate_pipeline_run_display(pipeline_run)
    return nil unless pipeline_run
    pipeline_run_display = pipeline_run.as_json.except("version")
    pipeline_run_display["version"] = { pipeline: select_version_aspect(pipeline_run, "idseq-pipeline"),
                                        nt: select_version_aspect(pipeline_run, "nt_k16"),
                                        nr: select_version_aspect(pipeline_run, "nr_rapsearch") }
    pipeline_run_display
  end

  def select_version_aspect(pipeline_run, aspect)
    return nil unless pipeline_run.version
    version_hash = JSON.parse(pipeline_run.version)
    aspect_hash = version_hash.select { |item| item["name"] == aspect }[0]
    return nil unless aspect_hash
    version_key = %w[nt_k16 nr_rapsearch].include?(aspect) ? "source_version" : "version"
    aspect_hash.key?(version_key) ? aspect_hash[version_key] : nil
  end

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
