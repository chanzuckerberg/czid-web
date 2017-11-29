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

  def parse_alignment_from_taxid_fasta(taxid_fasta, hit_type)
    alignment_info = {}
    taxid_fasta.each_line do |line|
      next unless line.start_with? '>'
      # example line:
      #  >family_nr:481:family_nt:-300:genus_nr:482:genus_nt:-200:species_nr:-100:species_nt:-100:NR::NT:WP_039856594.1: \
      #  NT-pident:91.1:NT-length:135:NT-mismatch:12:NT-gapopen:0:NT-qstart:1:NT-qend:135:NT-sstart:4070:NT-send:3936:NT-evalue:1.4e-64:NT-bitscore:256.3 \
      #  M05295:49:000000000-G17RL:1:1103:18620:22956/2
      read_id = line.strip.split(":read_id:")[1]
      accession_id = line.split(":" + hit_type + ":")[1].split(":")[0]
      alignment_start = line.split(":" + hit_type + "-sstart:")[1].split(":")[0]
      alignment_end = line.split(":" + hit_type + "-send:")[1].split(":")[0]
      read_info = { read_id: read_id, alignment_start: alignment_start, alignment_end: alignment_end }
      if alignment_info.key?(accession_id)
        alignment_info[accession_id][:aligned_reads].push(read_info)
      else
        alignment_info[accession_id] = { aligned_reads: [read_info] }
      end
    end
    # Add reference length information (this uses the NCBI eutils API)
    alignment_info.each do |accession_id, _info|
      alignment_info[accession_id][:reference_length] = get_sequence_length_from_accession(accession_id)
    end
    alignment_info
  end

  def get_sequence_length_from_accession(accession_id)
    sequence_length = `
      QUERY=#{accession_id}
      BASE=https://eutils.ncbi.nlm.nih.gov/entrez/eutils
      SEARCH_URL=${BASE}/esearch.fcgi?db=nuccore\\&term=${QUERY}\\&usehistory=y
      OUTPUT=$(curl $SEARCH_URL)
      WEB=$(echo $OUTPUT | sed -e 's/.*<WebEnv>\\(.*\\)<\\/WebEnv>.*/\\1/')
      KEY=$(echo $OUTPUT | sed -e 's/.*<QueryKey>\\(.*\\)<\\/QueryKey>.*/\\1/')
      FETCH_URL=${BASE}/efetch.fcgi?db=nuccore\\&query_key=${KEY}\\&WebEnv=${WEB}\\&rettype=fasta\\&retmode=xml
      RESULT=$(curl $FETCH_URL)
      SEQUENCE_LENGTH=$(echo $RESULT | sed -e 's/.*<TSeq_length>\\(.*\\)<\\/TSeq_length>.*/\\1/')
      echo $SEQUENCE_LENGTH
    `
    raise "sequence length lookup failed" unless $CHILD_STATUS.success?
    sequence_length.strip
  end
end
