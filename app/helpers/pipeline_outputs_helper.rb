module PipelineOutputsHelper
  Client = Aws::S3::Client.new

  def get_taxid_fasta(pipeline_output, taxid, tax_level, hit_type)
    uri = pipeline_output.sample.s3_paths_for_taxon_byteranges[tax_level][hit_type]
    # e.g. "s3://czbiohub-idseq-samples-development/samples/8/74/postprocess/taxid_annot_sorted_genus_nt.fasta"
    uri_parts = uri.split("/", 4)
    bucket = uri_parts[2]
    key = uri_parts[3]
    taxon_location = pipeline_output.taxon_byteranges.find_by(taxid: taxid, hit_type: hit_type)
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
      return 'Coming soon' # Temporary fix
    end
  end
  
  def get_sequence_length_for_accession(accession_id)
    sequence_length = `
      QUERY=#{accession_id}
      BASE=https://eutils.ncbi.nlm.nih.gov/entrez/eutils
      SEARCH_URL=${BASE}/esearch.fcgi?db=nuccore\&term=${QUERY}\&usehistory=y
      OUTPUT=$(curl $SEARCH_URL)
      WEB=$(echo $OUTPUT | sed -e 's/.*<WebEnv>\(.*\)<\/WebEnv>.*/\1/')
      KEY=$(echo $OUTPUT | sed -e 's/.*<QueryKey>\(.*\)<\/QueryKey>.*/\1/')
      FETCH_URL=${BASE}/efetch.fcgi?db=nuccore\&query_key=${KEY}\&WebEnv=${WEB}\&rettype=fasta\&retmode=xml
      RESULT=$(curl $FETCH_URL)
      SEQUENCE_LENGTH=$(echo $RESULT | sed -e 's/.*<TSeq_length>\(.*\)<\/TSeq_length>.*/\1/')
      echo $SEQUENCE_LENGTH
    `
    raise "sequence length lookup failed" unless $CHILD_STATUS.success?
    return sequence_length
  end
end
