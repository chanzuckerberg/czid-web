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
    version_hashes = JSON.parse(pipeline_run.version)
    # example for version_hashes:
    #   [{"name"=>"job_id", "version"=>"023e1f7d-8f96-42cc-ab07-6c233254f113"},
    #    {"name"=>"idseq-pipeline", "version"=>"1.0.9", "commit-sha"=>"d99a5e5c343a741cef7ea9ef888ead69f440c23d"},
    #    {"name"=>"nt_k16", "source_file"=>"/blast/db/FASTA/nt.gz", "source_version"=>8, "generation_date"=>"2018-02-20T00:23:45.299465", "indexing_version"=>"1.0.0"},
    #    {"name"=>"nr_rapsearch", "source_file"=>"/blast/db/FASTA/nr.gz", "source_version"=>12, "generation_date"=>"2018-02-20T00:23:45.299465", "indexing_version"=>"1.0.0"}]
    aspect_hash = version_hashes.select { |item| item["name"] == aspect }[0]
    if %w[nt_k16 nr_rapsearch].include?(aspect)
      return DateTime.parse(aspect_hash["generation_date"]).utc.strftime("%m-%Y")
    else
      return aspect_hash["version"]
    end
  rescue
    return nil
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
