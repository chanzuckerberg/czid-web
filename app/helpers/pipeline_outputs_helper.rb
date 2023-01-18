module PipelineOutputsHelper
  Client = Aws::S3::Client.new
  MAX_ALGIN_VIZ_READS_PER_ACCESSION = 20

  def curate_pipeline_run_display(pipeline_run)
    return nil unless pipeline_run

    pipeline_run_display = pipeline_run.as_json.except("version")
    pipeline_run_display["version"] = {
      pipeline: pipeline_run.pipeline_version,
      alignment_db: pipeline_run.alignment_config.name,
    }
    host_subtracted = pipeline_run.host_subtracted
    if host_subtracted
      pipeline_run_display["host_subtracted"] =
        if host_subtracted == "ercc"
          "ERCC only"
        else
          host_subtracted.titleize
        end
    end
    pipeline_run_display
  end

  def parse_accession(accession_details)
    results = accession_details
    reads = results.delete("reads")
    results["reads"] = []
    results["reads_count"] = reads.size
    if reads.size > MAX_ALGIN_VIZ_READS_PER_ACCESSION # only sample 20 reads
      reads = reads.sample(MAX_ALGIN_VIZ_READS_PER_ACCESSION)
    end
    reads.each do |read_info|
      read_id = read_info[0]
      read_part = read_id.split("/")[1].to_i
      read_seq = read_info[1]
      metrics = read_info[2]
      ref_seq = read_info[3]
      reversed = 0

      metrics[1..7] = metrics[1..7].map(&:to_i)
      metrics[0] = metrics[0].to_f
      metrics[8..9] = metrics[8..9].map(&:to_f)

      if metrics[6] > metrics[7] # high to low ref_seq match
        read_seq = read_seq.reverse
        reversed = 1
      end

      if (reversed == 1 && read_part == 1) || (reversed.zero? && read_part == 2)
        metrics[4..5] = [read_seq.size - metrics[5] + 1, read_seq.size - metrics[4] + 1]
      end

      aligned_portion = read_seq[(metrics[4] - 1)..(metrics[5] - 1)]
      left_portion = (metrics[4] - 2) >= 0 ? read_seq[0..(metrics[4] - 2)] : ""
      right_portion = metrics[5] < read_seq.size ? read_seq[(metrics[5])..(read_seq.size - 1)] : ""
      if ref_seq[0].size > left_portion.size
        # trim ref_seq[0]
        ref_seq[0] = ref_seq[0].reverse[0...left_portion.size].reverse
      else
        # pad ref_seq[0]
        ref_seq[0] = ' ' + ref_seq[0] while ref_seq[0].size < left_portion.size
      end

      if ref_seq[2].size > right_portion.size
        # pad right portion
        right_portion += ' ' while ref_seq[2].size > right_portion.size
      else
        # pad ref_seq[2]
        ref_seq[2] += ' ' while ref_seq[2].size < right_portion.size
      end

      quality_string1, mis_matches1 = generate_quality_string(ref_seq[1], aligned_portion)
      quality_string2, mis_matches2 = generate_quality_string(ref_seq[1], complement_seq(aligned_portion))
      quality_string = mis_matches1 < mis_matches2 ? quality_string1 : quality_string2
      white_space_left = left_portion.split("").map { |_c| ' ' }.join("")
      white_space_right = right_portion.split("").map { |_c| ' ' }.join("")

      ref_seq_display = "#{ref_seq[0]}|#{ref_seq[1]}|#{ref_seq[2]}"
      read_seq_display = "#{left_portion}|#{aligned_portion}|#{right_portion}"
      quality_string_display = "#{white_space_left}|#{quality_string}|#{white_space_right}"

      results["reads"] << { "read_id" => read_id,
                            "metrics" => metrics,
                            "reversed" => reversed,
                            "alignment" => [ref_seq_display,
                                            read_seq_display,
                                            quality_string_display,], }
    end
    results
  end

  def complement_seq(seq_string)
    seq_string.split("").map do |c|
      case c
      when 'A'
        'T'
      when 'T'
        'A'
      when 'C'
        'G'
      when 'G'
        'C'
      else
        c
      end
    end.join("")
  end

  def generate_quality_string(ref_string, seq_string)
    mis_matches = 0
    i = 0
    quality_string = ''
    while i < ref_string.size
      if (seq_string[i] == ref_string[i]) || [seq_string[i], ref_string[i]].include?('N')
        quality_string += ' '
      else
        mis_matches += 1
        quality_string += 'X'
      end
      i += 1
    end
    [quality_string, mis_matches]
  end

  def parse_tree(results, key, current_dict, raw = false)
    if current_dict["reads"]
      if raw # no further parsing
        # sort the coverage
        if current_dict["coverage_summary"] && current_dict["coverage_summary"]["coverage"]
          coverage = current_dict["coverage_summary"]["coverage"].sort_by { |k, _v| k.split("-")[0].to_i }
          current_dict["coverage_summary"]["coverage"] = coverage
        end
        # sort the reads
        reads = current_dict["reads"].sort { |a, b| (a[2][6]).to_i <=> (b[2][6]).to_i }
        current_dict["reads"] = reads
        results[key] = current_dict
      else
        results[key] = parse_accession(current_dict)
      end
    else
      current_dict.each do |key2, val|
        parse_tree(results, key2, val, raw)
      end
    end
  end

  def taxon_name(taxid, tax_level)
    taxon = TaxonLineage.find_by(taxid: taxid)
    taxon["#{tax_level}_name"] if taxon
  end

  # Get a .fasta string containing all the reads mapped to NT/NR for the provided taxid.
  def get_taxon_fasta_from_pipeline_run_combined_nt_nr(pipeline_run, taxid, tax_level)
    nt_array = get_taxon_fasta_from_pipeline_run(pipeline_run, taxid, tax_level, 'NT').split(">")
    nr_array = get_taxon_fasta_from_pipeline_run(pipeline_run, taxid, tax_level, 'NR').split(">")
    combined_array = ((nt_array | nr_array) - [''])

    # If there are no reads for this taxon, return nil for the fasta contents.
    if combined_array.empty?
      return nil
    end

    return ">" + combined_array.join(">")
  end

  def get_taxon_fasta_from_pipeline_run(pipeline_run, taxid, tax_level, hit_type)
    return '' unless pipeline_run

    uri = pipeline_run.s3_paths_for_taxon_byteranges[tax_level][hit_type]
    bucket, key = S3Util.parse_s3_path(uri)
    # Take the last matching taxon_byterange in case there are duplicate records due to a previous
    # bug (see IDSEQ-881)
    taxon_location = pipeline_run.taxon_byteranges.where(taxid: taxid, hit_type: hit_type).last if pipeline_run
    return '' if taxon_location.nil?

    begin
      range = "bytes=#{taxon_location.first_byte}-#{taxon_location.last_byte}"
      resp = Client.get_object(bucket: bucket, key: key, range: range)
      resp.body.read
    rescue Aws::S3::Errors::NoSuchKey => e
      LogUtil.log_error("File not found: #{key}", exception: e)
      return ''
    rescue Aws::S3::Errors::InvalidRange => e
      LogUtil.log_error("Invalid byterange requested: #{key} #{range}", exception: e)
      return ''
    end
  end

  # Either s3_path or bucket_name+key is required.
  def get_presigned_s3_url(s3_path: nil, filename: nil, duration: nil, bucket_name: nil, key: nil, content_type: nil)
    s3 = Aws::S3::Resource.new(client: Client)
    if s3_path
      bucket_name, key = S3Util.parse_s3_path(s3_path)
    end
    begin
      bucket_exists = Client.head_bucket(bucket: bucket_name)
      if bucket_exists
        bucket = s3.bucket(bucket_name)
        if bucket.object(key).exists?
          object = bucket.object(key)
          url = object.presigned_url(:get, response_content_disposition: "attachment; filename=#{filename}", response_content_type: content_type, expires_in: duration)
          return url
        end
      end
    rescue StandardError
      return nil
    end
  end

  def status_display_helper(states_by_output_hash, results_finalized_var, technology)
    # TODO(julie): Revisit if checking these outputs for the status still makes sense.
    # Status display for the frontend.
    h = states_by_output_hash
    if [PipelineRun::FINALIZED_SUCCESS, PipelineRun::FINALIZED_FAIL].include?(results_finalized_var)
      # No steps are running anymore
      if [h["taxon_byteranges"], h["taxon_counts"]].all? { |s| s == PipelineRun::STATUS_LOADED }
        "COMPLETE"
      elsif h["taxon_counts"] == PipelineRun::STATUS_LOADED
        # Alignment succeeded, postprocess failed
        "COMPLETE*"
      else
        "FAILED"
      end
    elsif technology == PipelineRun::TECHNOLOGY_INPUT[:nanopore]
      "RUNNING"
    elsif h["taxon_counts"] == PipelineRun::STATUS_LOADED
      # Alignment succeeded, postprocessing in progress
      "POST PROCESSING"
    elsif h["ercc_counts"] == PipelineRun::STATUS_LOADED
      # Host-filtering succeeded, alignment in progress
      "ALIGNMENT"
    else
      # Host-filtering in progress
      "HOST FILTERING"
    end
  end
end
