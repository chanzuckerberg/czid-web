require 'open3'
module SamplesHelper
  def host_genomes_list
    HostGenome.all.map { |h| h.slice('name', 'id') }
  end

  def get_summary_stats(jobstats)
    { remaining_reads: get_remaining_reads(jobstats),
      compression_ratio: compute_compression_ratio(jobstats),
      qc_percent: compute_qc_value(jobstats),
      percent_remaining: compute_percentage_reads(jobstats) }
  end

  def get_remaining_reads(jobstats)
    # reads remaining after host filtering
    bowtie2_stats = jobstats.find_by(task: 'run_bowtie2')
    bowtie2_stats.reads_after unless bowtie2_stats.nil?
  end

  def compute_compression_ratio(jobstats)
    cdhitdup_stats = jobstats.find_by(task: 'run_cdhitdup')
    (1.0 * cdhitdup_stats.reads_before) / cdhitdup_stats.reads_after unless cdhitdup_stats.nil?
  end

  def compute_qc_value(jobstats)
    priceseqfilter_stats = jobstats.find_by(task: 'run_priceseqfilter')
    (100.0 * priceseqfilter_stats.reads_after) / priceseqfilter_stats.reads_before unless priceseqfilter_stats.nil?
  end

  def compute_percentage_reads(jobstats)
    bowtie2_stats = jobstats.find_by(task: 'run_bowtie2')
    star_stats = jobstats.find_by(task: 'run_star')
    (100.0 * bowtie2_stats.reads_after) / star_stats.reads_before unless bowtie2_stats.nil? || star_stats.nil?
  end

  def parsed_samples_for_s3_path(s3_path, project_id, host_genome_id)
    default_attributes = { project_id: project_id,
                           host_genome_id: host_genome_id,
                           status: 'created' }
    s3_path.chomp!('/')
    command = "aws s3 ls #{s3_path}/ | grep -v Undetermined"
    s3_output, _stderr, status = Open3.capture3(command)
    return unless status.exitstatus.zero?
    s3_output.chomp!
    entries = s3_output.split("\n")
    samples = {}
    entries.each do |file_name|
      matched = /([^ ]*)_R(\d)_001.fastq.gz$/.match(file_name)
      source = matched[0]
      name = matched[1]
      read_idx = matched[2].to_i - 1
      samples[name] ||= default_attributes.clone
      samples[name][:input_files_attributes] ||= []
      samples[name][:input_files_attributes][read_idx] = { name: source,
                                                           source: "#{s3_path}/#{source}",
                                                           source_type: InputFile::SOURCE_TYPE_S3 }
    end

    sample_list = []
    samples.each do |name, sample_attributes|
      sample_attributes[:name] = name
      if sample_attributes[:input_files_attributes].size == 2
        sample_list << sample_attributes
      end
    end
    sample_list
  end

  def samples_output_data(samples)
    final_result = []
    samples.each do |output|
      output_data = {}
      pipeline_output = output.pipeline_runs.first ? output.pipeline_runs.first.pipeline_output : nil
      job_stats = pipeline_output ? pipeline_output.job_stats : nil
      summary_stats = job_stats ? get_summary_stats(job_stats) : nil

      output_data[:pipeline_output] = pipeline_output
      output_data[:job_stats] = job_stats
      output_data[:summary_stats] = summary_stats
      final_result.push(output_data)
    end
    final_result
  end

  def samples_pipeline_run_info(samples)
    pipeline_run_info = []
    pipeline_run_entry = {}
    samples.each do |output|
      pipeline_run_status = output.pipeline_runs.first ? output.pipeline_runs.first.job_status : nil
      pipeline_run_entry[:job_status_description] =
        if %w[CHECKED SUCCEEDED].include?(pipeline_run_status)
          'COMPLETE'
        elsif %w[FAILED ERROR].include?(pipeline_run_status)
          'FAILED'
        elsif %w[RUNNING LOADED].include?(pipeline_run_status)
          'IN PROGRESS'
        elsif pipeline_run_status == 'RUNNABLE'
          'INITIALIZING'
        else
          'UPLOADING'
        end
      pipeline_run_info.push(pipeline_run_entry)
    end
    pipeline_run_info
  end

  def samples_info(samples)
    { final_result: samples_output_data(samples),
      pipeline_run_info: samples_pipeline_run_info(samples) }
  end
end
