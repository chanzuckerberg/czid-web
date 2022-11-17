require 'open3'

class MngsReadsStatsLoadService
  include Callable

  def initialize(pipeline_run)
    @pipeline_run = pipeline_run
  end

  def call
    all_counts = fetch_counts(@pipeline_run)
    job_stats = compile_stats(@pipeline_run, all_counts)
    load_job_stats(@pipeline_run, job_stats)
    upload_stats_file(@pipeline_run, job_stats)
  end

  private

  # Fetches stats from all *.count files in results dir and returns them
  # as an array of hashes.
  def fetch_counts(pipeline_run)
    res_folder = pipeline_run.output_s3_path_with_version
    stdout = Syscall.pipe_with_output(["aws", "s3", "ls", "#{res_folder}/"], ["grep", "count$"])

    all_counts = []
    stdout.split("\n").each do |line|
      fname = line.split(" ")[3] # Last col in line
      contents = Syscall.s3_read_json("#{res_folder}/#{fname}")
      # Ex: {"gsnap_filter_out": 194}
      contents.each do |key, count|
        all_counts << { task: key, reads_after: count }
      end
    end
    all_counts
  end

  # Given the stats fetched from all *.count files, calculates additional stats.
  # IMPORTANT NOTE: This method ALSO sets attributes of pipeline run instance.
  # For unmapped_reads, it will read a .count file from /postprocess s3 dir.
  # Example output:
  # [
  #   {
  #     :reads_after => 8262,
  #     :task => "unidentified_fasta"
  #   },
  #   {
  #     :reads_after => 8558,
  #     :task => "bowtie2_out"
  #   },
  #   ...
  #   {
  #     :total_reads => 10000
  #   },
  #   {
  #     :fraction_subsampled => 1.0
  #   },
  #   {
  #     :adjusted_remaining_reads => 8558
  #   }
  # ]
  def compile_stats(pipeline_run, all_counts)
    # Load total reads
    total = all_counts.detect { |entry| entry.value?("fastqs") }
    if total
      all_counts << { total_reads: total[:reads_after] }
      pipeline_run.total_reads = total[:reads_after]
    end

    # Load truncation
    truncation = all_counts.detect { |entry| entry.value?("truncated") }
    if truncation
      pipeline_run.truncated = truncation[:reads_after]
    end

    # Load subsample fraction
    sub_before = all_counts.detect { |entry| entry.value?("bowtie2_out") }
    sub_after = all_counts.detect { |entry| entry.value?("subsampled_out") }
    frac = -1
    if sub_before && sub_after
      frac = sub_before[:reads_after] > 0 ? ((1.0 * sub_after[:reads_after]) / sub_before[:reads_after]) : 1.0
      all_counts << { fraction_subsampled: frac }
      pipeline_run.fraction_subsampled = frac
    end

    # Load remaining reads
    # This is an approximation multiplied by the subsampled ratio so that it
    # can be compared to total reads for the user. Number of reads after host
    # filtering step vs. total reads as if subsampling had never occurred.
    rem = all_counts.detect { |entry| entry.value?("gsnap_filter_out") }
    if rem && frac > 0
      adjusted_remaining_reads = (rem[:reads_after] * (1 / frac)).to_i
      all_counts << { adjusted_remaining_reads: adjusted_remaining_reads }
      pipeline_run.adjusted_remaining_reads = adjusted_remaining_reads
    else
      # gsnap filter is not done. use bowtie output as remaining reads
      bowtie = all_counts.detect { |entry| entry.value?("bowtie2_out") }
      if bowtie
        pipeline_run.adjusted_remaining_reads = bowtie[:reads_after]
      end
    end

    # Load unidentified reads
    pipeline_run.unmapped_reads = fetch_unmapped_reads(pipeline_run, all_counts) || pipeline_run.unmapped_reads

    pipeline_run.save!
    all_counts
  end

  # Given the compiled hash of job stats, loads them into the JobStats table.
  def load_job_stats(pipeline_run, stats_array)
    stats_array = stats_array.select { |entry| entry.key?(:task) }
    pipeline_run.job_stats.destroy_all
    pipeline_run.update!(job_stats_attributes: stats_array)
  end

  # Save the compiled stats as stats.json in s3.
  def upload_stats_file(pipeline_run, job_stats)
    # Write JSON to a file
    tmp = Tempfile.new
    tmp.write(job_stats.to_json)
    tmp.close

    # Copy to S3. Overwrite if exists.
    res_folder = pipeline_run.output_s3_path_with_version
    Syscall.s3_cp(tmp.path.to_s, "#{res_folder}/#{PipelineRun::STATS_JSON_NAME}")
  end

  # Fetch the unmapped reads count from alignment stage then refined counts from
  # assembly stage, as each becomes available. Prior to Dec 2019, the count was
  # only fetched from alignment.
  def fetch_unmapped_reads(
    pipeline_run,
    all_counts
  )
    s3_path = "#{pipeline_run.postprocess_output_s3_path}/#{PipelineRun::DAG_ANNOTATED_COUNT_BASENAME}"
    unmapped_reads = nil
    unidentified = all_counts.detect { |entry| entry.value?("unidentified_fasta") }
    if unidentified
      unmapped_reads = unidentified[:reads_after]

      # This will fetch unconditionally on every iteration of the results
      # monitor. My attempts to restrict fetching with "finalized?" and
      # "step_number == 3" both failed to work in production.
      if pipeline_run.send(:supports_assembly?)
        # see idseq_dag/steps/generate_annotated_fasta.py
        begin
          Rails.logger.info("Fetching file: #{s3_path}")
          refined_annotated_out = Syscall.s3_read_json(s3_path)
          unmapped_reads = refined_annotated_out["unidentified_fasta"]
        rescue StandardError
          Rails.logger.warn("Could not read file: #{s3_path}")
        end
      end
    end
    unmapped_reads
  end
end
