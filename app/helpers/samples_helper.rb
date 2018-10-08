require 'open3'
require 'csv'

module SamplesHelper
  include PipelineOutputsHelper

  def generate_sample_list_csv(formatted_samples)
    attributes = %w[sample_name uploader upload_date runtime_seconds overall_job_status num_input_files
                    total_reads nonhost_reads nonhost_reads_percent ercc_reads subsampled_fraction
                    quality_control compression_ratio tissue_type nucleotide_type
                    location host_genome notes sample_diagnosis]
    CSV.generate(headers: true) do |csv|
      csv << attributes
      formatted_samples.each do |sample_info|
        derived_output = sample_info[:derived_sample_output]
        pipeline_run = derived_output[:pipeline_run]
        db_sample = sample_info[:db_sample]
        run_info = sample_info[:run_info]
        data_values = { sample_name: db_sample ? db_sample[:name] : '',
                        upload_date: db_sample ? db_sample[:created_at] : '',
                        num_input_files: db_sample ? db_sample.input_files.count : '',
                        total_reads: pipeline_run ? pipeline_run.total_reads : '',
                        nonhost_reads: pipeline_run ? pipeline_run.adjusted_remaining_reads : '',
                        nonhost_reads_percent: derived_output[:summary_stats] && derived_output[:summary_stats][:percent_remaining] ? derived_output[:summary_stats][:percent_remaining].round(3) : '',
                        ercc_reads: pipeline_run ? pipeline_run.total_ercc_reads : '',
                        subsampled_fraction: pipeline_run ? pipeline_run.fraction_subsampled : '',
                        quality_control: derived_output[:summary_stats] && derived_output[:summary_stats][:qc_percent] ? derived_output[:summary_stats][:qc_percent].round(3) : '',
                        compression_ratio: derived_output[:summary_stats] && derived_output[:summary_stats][:compression_ratio] ? derived_output[:summary_stats][:compression_ratio].round(2) : '',
                        tissue_type: db_sample ? db_sample[:sample_tissue] : '',
                        nucleotide_type: db_sample ? db_sample[:sample_template] : '',
                        location: db_sample ? db_sample[:sample_location] : '',
                        host_genome: derived_output ? derived_output[:host_genome_name] : '',
                        notes: db_sample ? db_sample[:sample_notes] : '',
                        overall_job_status: run_info ? run_info[:result_status_description] : '',
                        uploader: sample_info[:uploader] ? sample_info[:uploader][:name] : '',
                        runtime_seconds: run_info ? run_info[:total_runtime] : '',
                        sample_library: db_sample ? db_sample[:sample_library] : '',
                        sample_sequencer: db_sample ? db_sample[:sample_sequencer] : '',
                        sample_date: db_sample ? db_sample[:sample_date] : '',
                        sample_input_pg: db_sample ? db_sample[:sample_input_pg] : '',
                        sample_batch: db_sample ? db_sample[:sample_batch] : '',
                        sample_diagnosis: db_sample ? db_sample[:sample_diagnosis] : '',
                        sample_organism: db_sample ? db_sample[:sample_organism] : '',
                        sample_detection: db_sample ? db_sample[:sample_detection] : '' }
        attributes_as_symbols = attributes.map(&:to_sym)
        csv << data_values.values_at(*attributes_as_symbols)
      end
    end
  end

  # Load bulk metadata from a CSV file
  # NOTE: Succeeded by Metadatum#load_csv_from_s3 for new Metadatum objects.
  def populate_metadata_bulk(csv_s3_path)
    # Load the CSV data. CSV should have columns "sample_name", "project_name", and any desired columns from Sample::METADATA_FIELDS.
    csv_data = get_s3_file(csv_s3_path)
    csv_data.delete!("\uFEFF") # Remove BOM if present (file likely comes from Excel)
    CSV.parse(csv_data, headers: true) do |row|
      # Find the right project and sample
      row_details = row.to_h
      proj = Project.find_by(name: row_details['project_name'])
      next unless proj
      sampl = Sample.find_by(project_id: proj, name: row_details['sample_name'])
      next unless sampl

      # Format the new details. Append to existing notes.
      new_details = {}
      new_details['sample_notes'] = sampl.sample_notes || ''
      row_details.each do |key, value|
        if !key || !value || key == 'sample_name' || key == 'project_name'
          next
        end
        if Sample::METADATA_FIELDS.include?(key.to_sym)
          new_details[key] = value
        else # Otherwise throw in notes
          new_details['sample_notes'] << format("\n- %s: %s", key, value)
        end
      end
      new_details['sample_notes'].strip!
      sampl.update_attributes!(new_details)
    end
  end

  def host_genomes_list
    HostGenome.all.map { |h| h.slice('name', 'id') }
  end

  def get_summary_stats(job_stats_hash, pipeline_run)
    pr = pipeline_run
    unmapped_reads = pr.nil? ? nil : pr.unmapped_reads
    last_processed_at = pr.nil? ? nil : pr.created_at
    { adjusted_remaining_reads: get_adjusted_remaining_reads(pr),
      compression_ratio: compute_compression_ratio(job_stats_hash),
      qc_percent: compute_qc_value(job_stats_hash),
      percent_remaining: compute_percentage_reads(pr),
      unmapped_reads: unmapped_reads,
      last_processed_at: last_processed_at }
  end

  def get_adjusted_remaining_reads(pr)
    pr.adjusted_remaining_reads unless pr.nil?
  end

  def compute_compression_ratio(job_stats_hash)
    cdhitdup_stats = job_stats_hash['cdhitdup_out']
    priceseq_stats = job_stats_hash['priceseq_out']
    (1.0 * priceseq_stats['reads_after']) / cdhitdup_stats['reads_after'] unless cdhitdup_stats.nil? || priceseq_stats.nil?
  end

  def compute_qc_value(job_stats_hash)
    star_stats = job_stats_hash['star_out']
    priceseqfilter_stats = job_stats_hash['priceseq_out']
    (100.0 * priceseqfilter_stats['reads_after']) / star_stats['reads_after'] unless priceseqfilter_stats.nil? || star_stats.nil?
  end

  def compute_percentage_reads(pr)
    (100.0 * pr.adjusted_remaining_reads) / pr.total_reads unless pr.nil? || pr.adjusted_remaining_reads.nil? || pr.total_reads.nil?
  end

  def sample_status_display_for_hidden_page(sample)
    if sample.status == Sample::STATUS_CREATED
      'uploading'
    elsif sample.status == Sample::STATUS_CHECKED
      pipeline_run = sample.pipeline_runs.first
      return '' unless pipeline_run
      if pipeline_run.job_status == PipelineRun::STATUS_CHECKED
        return 'complete'
      elsif pipeline_run.job_status == PipelineRun::STATUS_FAILED
        return 'failed'
      elsif pipeline_run.job_status == PipelineRun::STATUS_RUNNING
        return 'running'
      else
        return 'initializing'
      end
    end
  end

  def parsed_samples_for_s3_path(s3_path, project_id, host_genome_id)
    default_attributes = { project_id: project_id,
                           host_genome_id: host_genome_id,
                           status: 'created' }
    s3_path.chomp!('/')
    s3_bucket = 's3://' + s3_path.sub('s3://', '').split('/')[0]
    s3_output, _stderr, status = Open3.capture3("aws", "s3", "ls", "--recursive", "#{s3_path}/")
    return unless status.exitstatus.zero?
    s3_output.chomp!
    entries = s3_output.split("\n").reject { |line| line.include? "Undetermined" }
    samples = {}
    entries.each do |file_name|
      matched_paired = InputFile::BULK_FILE_PAIRED_REGEX.match(file_name)
      matched_single = InputFile::BULK_FILE_SINGLE_REGEX.match(file_name)
      if matched_paired
        matched = matched_paired
        read_idx = matched[2].to_i - 1
      elsif matched_single
        matched = matched_single
        read_idx = 0
      else
        next
      end
      source = matched[0]
      name = matched[1].split('/')[-1]
      samples[name] ||= default_attributes.clone
      samples[name][:input_files_attributes] ||= []
      samples[name][:input_files_attributes][read_idx] = { name: source.split('/')[-1],
                                                           source: "#{s3_bucket}/#{source}",
                                                           source_type: InputFile::SOURCE_TYPE_S3 }
    end

    sample_list = []
    samples.each do |name, sample_attributes|
      sample_attributes[:name] = name
      if sample_attributes[:input_files_attributes].size.between?(1, 2)
        sample_list << sample_attributes
      end
    end
    sample_list
  end

  def filter_by_status(samples, query)
    top_pipeline_run_clause = "pipeline_runs.id in (select max(id) from pipeline_runs group by sample_id)"
    if query == 'In Progress'
      join_clause = "LEFT OUTER JOIN pipeline_runs ON pipeline_runs.sample_id = samples.id"
      samples.joins(join_clause).where("#{top_pipeline_run_clause} or pipeline_runs.id is NULL").where("samples.status = ? or pipeline_runs.job_status is NULL or (pipeline_runs.job_status NOT IN (?) and pipeline_runs.finalized != 1)", Sample::STATUS_CREATED, [PipelineRun::STATUS_CHECKED, PipelineRun::STATUS_FAILED])
    else
      join_clause = "INNER JOIN pipeline_runs ON pipeline_runs.sample_id = samples.id"
      samples_pipeline_runs = samples.joins(join_clause).where(status: Sample::STATUS_CHECKED).where(top_pipeline_run_clause)
      if query == 'Failed'
        samples_pipeline_runs.where("pipeline_runs.job_status like '%FAILED'")
      elsif query == 'Complete'
        samples_pipeline_runs.where("(pipeline_runs.job_status = ? or pipeline_runs.job_status like '%READY') and pipeline_runs.finalized = 1", PipelineRun::STATUS_CHECKED)
      else # query == 'All' or something unexpected
        samples
      end
    end
  end

  def get_total_runtime(pipeline_run, run_stages)
    if pipeline_run.finalized?
      # total processing time (without time spent waiting), for performance evaluation
      (run_stages || []).map { |rs| pipeline_run.ready_step && rs.step_number > pipeline_run.ready_step ? 0 : (rs.updated_at - rs.created_at) }.sum
    else
      # time since pipeline kickoff (including time spent waiting), for run diagnostics
      (Time.current - pipeline_run.created_at)
    end
  end

  def filter_by_tissue_type(samples, query)
    return samples.where("false") if query == ["none"]
    updated_query = query.map { |x| x == 'Not set' ? nil : x }
    samples.where(sample_tissue: updated_query)
  end

  def filter_by_host(samples, query)
    return samples.where("false") if query == ["none"]
    samples.where(host_genome_id: query)
  end

  def pipeline_run_info(pipeline_run, report_ready_pipeline_run_ids, pipeline_run_stages_by_pipeline_run_id, output_states_by_pipeline_run_id)
    pipeline_run_entry = {}
    if pipeline_run
      run_stages = pipeline_run_stages_by_pipeline_run_id[pipeline_run.id]
      pipeline_run_entry[:total_runtime] = get_total_runtime(pipeline_run, run_stages)
      pipeline_run_entry[:with_assembly] = pipeline_run.assembly? ? 1 : 0
      pipeline_run_entry[:result_status_description] = pipeline_run.status_display(output_states_by_pipeline_run_id)
      pipeline_run_entry[:finalized] = pipeline_run.finalized
      pipeline_run_entry[:report_ready] = report_ready_pipeline_run_ids.include?(pipeline_run.id)
    else
      pipeline_run_entry[:result_status_description] = 'WAITING'
      pipeline_run_entry[:finalized] = 0
      pipeline_run_entry[:report_ready] = 0
    end
    pipeline_run_entry
  end

  def sample_uploader(sample)
    user = {}
    user[:name] = (sample.user.name if sample.user)
    user
  end

  def sample_derived_data(sample, job_stats_hash)
    output_data = {}
    pipeline_run = sample.pipeline_runs.first
    summary_stats = job_stats_hash.present? ? get_summary_stats(job_stats_hash, pipeline_run) : nil
    output_data[:pipeline_run] = pipeline_run
    output_data[:host_genome_name] = sample.host_genome ? sample.host_genome.name : nil
    output_data[:summary_stats] = summary_stats

    output_data
  end

  def job_stats_multiget(pipeline_run_ids)
    # get job_stats from db
    all_job_stats = JobStat.where(pipeline_run_id: pipeline_run_ids)
    job_stats_by_pipeline_run_id = {}
    all_job_stats.each do |entry|
      job_stats_by_pipeline_run_id[entry.pipeline_run_id] ||= {}
      job_stats_by_pipeline_run_id[entry.pipeline_run_id][entry.task] = entry
    end
    job_stats_by_pipeline_run_id
  end

  def job_stats_get(pipeline_run_id)
    # get job_stats from db
    job_stats_multiget([pipeline_run_id])[pipeline_run_id]
  end

  def report_ready_multiget(pipeline_run_ids)
    # query db to get ids of pipeline_runs for which the report is ready
    join_clause = "LEFT OUTER JOIN output_states ON output_states.pipeline_run_id = pipeline_runs.id AND output_states.output = '#{PipelineRun::REPORT_READY_OUTPUT}'"
    report_ready_clause = "output_states.state = '#{PipelineRun::STATUS_LOADED}'"

    clause_for_old_results = "job_status = '#{PipelineRun::STATUS_CHECKED}' or job_status like '%|READY%'"
    # TODO: migrate old runs so we don't need to deal with them separately in the code

    PipelineRun.where(id: pipeline_run_ids).joins(join_clause).where("#{report_ready_clause} or #{clause_for_old_results}").pluck(:id)
  end

  def top_pipeline_runs_multiget(sample_ids)
    top_pipeline_runs = PipelineRun.where("id in (select x.id from (select max(id) as id from pipeline_runs where
                  sample_id in (#{sample_ids.join(',')}) group by sample_id) as x)")
    top_pipeline_run_by_sample_id = {}
    top_pipeline_runs.each do |pr|
      top_pipeline_run_by_sample_id[pr.sample_id] = pr
    end
    top_pipeline_run_by_sample_id
  end

  def dependent_records_multiget(table, parent_id_column_sym, parent_ids)
    all_records = table.where(parent_id_column_sym => parent_ids)
    records_by_parent_id = {}
    all_records.each do |r|
      records_by_parent_id[r[parent_id_column_sym]] ||= []
      records_by_parent_id[r[parent_id_column_sym]] << r
    end
    records_by_parent_id
  end

  def format_samples(samples)
    formatted_samples = []
    return formatted_samples if samples.empty?

    # Do major SQL queries
    sample_ids = samples.map(&:id)
    top_pipeline_run_by_sample_id = top_pipeline_runs_multiget(sample_ids)
    pipeline_run_ids = top_pipeline_run_by_sample_id.values.map(&:id)
    job_stats_by_pipeline_run_id = job_stats_multiget(pipeline_run_ids)
    report_ready_pipeline_run_ids = report_ready_multiget(pipeline_run_ids)
    pipeline_run_stages_by_pipeline_run_id = dependent_records_multiget(PipelineRunStage, :pipeline_run_id, pipeline_run_ids)
    output_states_by_pipeline_run_id = dependent_records_multiget(OutputState, :pipeline_run_id, pipeline_run_ids)

    # Massage data into the right format
    samples.each_with_index do |sample|
      job_info = {}
      job_info[:db_sample] = sample
      top_pipeline_run = top_pipeline_run_by_sample_id[sample.id]
      job_stats_hash = top_pipeline_run ? job_stats_by_pipeline_run_id[top_pipeline_run.id] : {}
      job_info[:derived_sample_output] = sample_derived_data(sample, job_stats_hash)
      job_info[:run_info] = pipeline_run_info(top_pipeline_run, report_ready_pipeline_run_ids,
                                              pipeline_run_stages_by_pipeline_run_id, output_states_by_pipeline_run_id)
      job_info[:uploader] = sample_uploader(sample)
      formatted_samples.push(job_info)
    end
    formatted_samples
  end
end
