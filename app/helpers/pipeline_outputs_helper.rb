module PipelineOutputsHelper
  Client = Aws::S3::Client.new
  MAX_ALGIN_VIZ_READS_PER_ACCESSION = 20

  def curate_pipeline_run_display(pipeline_run)
    return nil unless pipeline_run
    pipeline_run_display = pipeline_run.as_json.except("version")
    pipeline_run_display["version"] = {
      pipeline: pipeline_run.pipeline_version,
      alignment_db: pipeline_run.alignment_config.name
    }
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
                                            quality_string_display] }
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

  def parse_alignment_results(taxid, tax_level, alignment_data)
    results = {}
    parse_tree(results, taxid, alignment_data)
    accession_ids = results.keys.sort_by { |k| -results[k]['reads_count'] }

    name = taxon_name(taxid, tax_level)
    title = name.to_s + "(#{tax_level}) Alignment (#{results.size} unique accessions)"
    { "title" => title, "details" => results, "accessions" => accession_ids }
  end

  def get_taxid_fasta(sample, taxid, tax_level, hit_type)
    pipeline_run = sample.pipeline_runs.first
    return '' unless pipeline_run
    uri = pipeline_run.s3_paths_for_taxon_byteranges[tax_level][hit_type]
    # e.g. "s3://czbiohub-idseq-samples-development/samples/8/74/postprocess/taxid_annot_sorted_genus_nt.fasta"
    uri_parts = uri.split("/", 4)
    bucket = uri_parts[2]
    key = uri_parts[3]
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

  def status_display_helper(states_by_output_hash, results_finalized_var)
    # Status display for the frontend.
    h = states_by_output_hash
    if [PipelineRun::FINALIZED_SUCCESS, PipelineRun::FINALIZED_FAIL].include?(results_finalized_var)
      if [h["taxon_byteranges"], h["taxon_counts"]].all? { |s| s == PipelineRun::STATUS_LOADED }
        "COMPLETE"
      elsif h["taxon_counts"] == PipelineRun::STATUS_LOADED
        "COMPLETE*"
      else
        "FAILED"
      end
    elsif h["taxon_counts"] == PipelineRun::STATUS_LOADED
      # alignment succeeded, postprocessing in progress
      "POST PROCESSING"
    elsif h["ercc_counts"] == PipelineRun::STATUS_LOADED
      # host-filtering succeeded, alignment in progress
      "ALIGNMENT"
    else
      # host-filtering in progress
      "HOST FILTERING"
    end
  end
end
