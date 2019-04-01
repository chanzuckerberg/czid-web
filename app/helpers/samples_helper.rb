require 'open3'
require 'csv'

module SamplesHelper
  include PipelineOutputsHelper
  include ErrorHelper

  def generate_sample_list_csv(formatted_samples)
    attributes = %w[sample_name uploader upload_date overall_job_status runtime_seconds
                    total_reads nonhost_reads nonhost_reads_percent total_ercc_reads subsampled_fraction
                    quality_control compression_ratio sample_type nucleotide_type collection_location
                    host_genome notes]
    CSV.generate(headers: true) do |csv|
      csv << attributes
      formatted_samples.each do |sample_info|
        derived_output = sample_info[:derived_sample_output]
        pipeline_run = derived_output[:pipeline_run]
        db_sample = sample_info[:db_sample]
        run_info = sample_info[:run_info]
        metadata = sample_info[:metadata]
        data_values = { sample_name: db_sample ? db_sample[:name] : '',
                        uploader: sample_info[:uploader] ? sample_info[:uploader][:name] : '',
                        upload_date: db_sample ? db_sample[:created_at] : '',
                        overall_job_status: run_info ? run_info[:result_status_description] : '',
                        runtime_seconds: run_info ? run_info[:total_runtime] : '',
                        total_reads: pipeline_run ? pipeline_run.total_reads : '',
                        nonhost_reads: pipeline_run ? pipeline_run.adjusted_remaining_reads : '',
                        nonhost_reads_percent: derived_output[:summary_stats] && derived_output[:summary_stats][:percent_remaining] ? derived_output[:summary_stats][:percent_remaining].round(3) : '',
                        total_ercc_reads: pipeline_run ? pipeline_run.total_ercc_reads : '',
                        subsampled_fraction: pipeline_run ? pipeline_run.fraction_subsampled : '',
                        quality_control: derived_output[:summary_stats] && derived_output[:summary_stats][:qc_percent] ? derived_output[:summary_stats][:qc_percent].round(3) : '',
                        compression_ratio: derived_output[:summary_stats] && derived_output[:summary_stats][:compression_ratio] ? derived_output[:summary_stats][:compression_ratio].round(2) : '',
                        sample_type: metadata && metadata[:sample_type] ? metadata[:sample_type] : '',
                        nucleotide_type: metadata && metadata[:nucleotide_type] ? metadata[:nucleotide_type] : '',
                        collection_location: metadata && metadata[:collection_location] ? metadata[:collection_location] : '',
                        host_genome: derived_output && derived_output[:host_genome_name] ? derived_output[:host_genome_name] : '',
                        notes: db_sample && db_sample[:sample_notes] ? db_sample[:sample_notes] : '' }
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
      pipeline_run = sample.first_pipeline_run
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
    default_attributes = { project_id: project_id.to_i,
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

  def filter_samples(samples, params)
    host = params[:host]
    location = params[:location]
    taxon = params[:taxon]
    time = params[:time]
    tissue = params[:tissue]
    visibility = params[:visibility]
    project_id = params[:projectId]

    samples = samples.where(project_id: project_id) if project_id.present?
    samples = filter_by_taxid(samples, taxon) if taxon.present?
    samples = filter_by_host(samples, host) if host.present?
    samples = filter_by_metadata_key(samples, "collection_location", location) if location.present?
    samples = filter_by_time(samples, Date.parse(time[0]), Date.parse(time[1])) if time.present?
    samples = filter_by_metadata_key(samples, "sample_type", tissue) if tissue.present?
    samples = filter_by_visibility(samples, visibility) if visibility.present?

    return samples
  end

  def filter_by_status(samples, query)
    top_pipeline_run_clause = "pipeline_runs.id in (select max(id) from pipeline_runs group by sample_id)"
    if query == 'In Progress'
      samples.joins(:pipeline_runs).where("#{top_pipeline_run_clause} or pipeline_runs.id is NULL").where("samples.status = ? or pipeline_runs.job_status is NULL or (pipeline_runs.job_status NOT IN (?) and pipeline_runs.finalized != 1)", Sample::STATUS_CREATED, [PipelineRun::STATUS_CHECKED, PipelineRun::STATUS_FAILED])
    else
      samples_pipeline_runs = samples.joins(:pipeline_runs).where(status: Sample::STATUS_CHECKED).where(top_pipeline_run_clause)
      if query == 'Failed'
        samples_pipeline_runs.where("pipeline_runs.job_status like '%FAILED'")
      elsif query == 'Complete'
        samples_pipeline_runs.where("(pipeline_runs.job_status = ? or pipeline_runs.job_status like '%READY') and pipeline_runs.finalized = 1", PipelineRun::STATUS_CHECKED)
      else # query == 'All' or something unexpected
        samples
      end
    end
  end

  def filter_by_metadatum(samples, key, query)
    # !DEPRECATED
    # TODO(tiago): This filter will be replaced by filter_by_metadata_key
    return samples.where("false") if query == ["none"]

    # Use a set to speed up query.
    query_set = query.to_set

    include_not_set = query.include?('Not set')

    sample_type_metadatum = Metadatum
                            .where(sample_id: samples.pluck(:id), key: key)

    matching_sample_ids = sample_type_metadatum
                          .select { |m| query_set.include?(m.validated_value) }
                          .pluck(:sample_id)

    if include_not_set
      not_set_ids = samples.pluck(:id) - sample_type_metadatum.pluck(:sample_id)
      matching_sample_ids.concat(not_set_ids)
    end

    samples.where(id: matching_sample_ids)
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

  def sample_derived_data(sample, pipeline_run, job_stats_hash)
    output_data = {}
    summary_stats = job_stats_hash.present? ? get_summary_stats(job_stats_hash, pipeline_run) : nil
    output_data[:pipeline_run] = pipeline_run
    output_data[:host_genome_name] = sample.host_genome ? sample.host_genome.name : nil
    output_data[:project_name] = sample.project ? sample.project.name : nil
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

  def metadata_multiget(sample_ids)
    metadata = Metadatum.includes(:metadata_field).where(sample_id: sample_ids)

    metadata_by_sample_id = {}
    metadata.each do |metadatum|
      metadata_by_sample_id[metadatum.sample_id] ||= {}
      metadata_by_sample_id[metadatum.sample_id][metadatum.key.to_sym] = metadatum.validated_value
    end

    metadata_by_sample_id
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

  def format_samples_basic(samples)
    metadata_by_sample_id = metadata_multiget(samples.map(&:id))
    return samples.map do |sample|
      {
        name: sample.name,
        id: sample.id,
        host_genome_id: sample.host_genome_id,
        metadata: metadata_by_sample_id[sample.id]
      }
    end
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
    metadata_by_sample_id = metadata_multiget(sample_ids)

    # Massage data into the right format
    samples.includes(:pipeline_runs, :host_genome, :project, :input_files, :user).each_with_index do |sample|
      job_info = {}
      job_info[:db_sample] = sample
      job_info[:metadata] = metadata_by_sample_id[sample.id]
      top_pipeline_run = top_pipeline_run_by_sample_id[sample.id]
      job_stats_hash = top_pipeline_run ? job_stats_by_pipeline_run_id[top_pipeline_run.id] : {}
      job_info[:derived_sample_output] = sample_derived_data(sample, top_pipeline_run, job_stats_hash)
      job_info[:run_info] = pipeline_run_info(top_pipeline_run, report_ready_pipeline_run_ids,
                                              pipeline_run_stages_by_pipeline_run_id, output_states_by_pipeline_run_id)
      job_info[:uploader] = sample_uploader(sample)
      formatted_samples.push(job_info)
    end
    formatted_samples
  end

  def visibility(samples)
    # When in conjunction with some filters, the query below was not returning the public property,
    # thus we need to get ids and redo the query independently
    sample_ids = samples.pluck(:id)
    return current_power
           .samples
           .where(id: sample_ids)
           .joins(:project)
           .select("samples.*", "IF(projects.public_access = 1 OR DATE_ADD(samples.created_at, INTERVAL projects.days_to_keep_sample_private DAY) < '#{Time.current.strftime('%y-%m-%d')}', true, false) AS public")
           .map(&:public)
  end

  # From the list of samples, return the ids of all samples whose top pipeline run is report ready.
  def get_ready_sample_ids(samples)
    ready_sample_ids = []
    return ready_sample_ids if samples.empty?

    # Do major SQL queries
    sample_ids = samples.map(&:id)
    top_pipeline_run_by_sample_id = top_pipeline_runs_multiget(sample_ids)
    pipeline_run_ids = top_pipeline_run_by_sample_id.values.map(&:id)
    report_ready_pipeline_run_ids = report_ready_multiget(pipeline_run_ids)

    samples.each_with_index do |sample|
      top_pipeline_run = top_pipeline_run_by_sample_id[sample.id]

      if top_pipeline_run && report_ready_pipeline_run_ids.include?(top_pipeline_run.id)
        ready_sample_ids.push(sample.id)
      end
    end

    ready_sample_ids
  end

  def get_distinct_sample_types(samples)
    Metadatum
      .where(key: "sample_type")
      .where(sample_id: samples.pluck(:id))
      .pluck(:string_validated_value)
      .uniq
  end

  # Takes an array of samples and uploads metadata for those samples.
  # metadata is a hash mapping sample name to hash of fields.
  def upload_metadata_for_samples(samples, metadata)
    errors = []

    metadata_to_save = []

    metadata.each do |sample_name, fields|
      sample = samples.find { |s| s.name == sample_name }

      unless sample
        errors.push(MetadataUploadErrors.invalid_sample_name(sample_name))
        next
      end

      fields.each do |key, value|
        next if ["Sample Name", "Host Genome", "sample_name", "host_genome"].include?(key)

        result = sample.get_metadatum_to_save(key, value)

        if result[:status] == "ok"
          if result[:metadatum]
            metadata_to_save << result[:metadatum]
          end
        else
          errors.push(MetadataUploadErrors.save_error(key, value))
        end
      end
    end

    # Use activerecord-import to bulk import the metadata.
    # With on_duplicate_key_update, activerecord-import will correct update existing rows.
    # Rails model validations are also checked.
    update_keys = [:raw_value, :string_validated_value, :number_validated_value, :date_validated_value]
    results = Metadatum.import metadata_to_save, validate: true, on_duplicate_key_update: update_keys
    results.failed_instances.each do |model|
      errors.push(MetadataUploadErrors.save_error(model.key, model.raw_value))
    end

    errors
  end

  def upload_samples_with_metadata(samples_to_upload, metadata)
    samples = []
    errors = []
    samples_to_upload.each do |sample_attributes|
      sample_attributes[:input_files_attributes].reject! { |f| f["source"] == '' }

      if sample_attributes[:host_genome_name]
        name = sample_attributes.delete(:host_genome_name)
        sample_attributes[:host_genome_id] = HostGenome.find_by(name: name).id
      end
      sample = Sample.new(sample_attributes)
      sample.input_files.each { |f| f.name ||= File.basename(f.source) }

      # If s3 upload, set "bulk_mode" to true.
      sample.bulk_mode = sample.input_files.map(&:source_type).include?("s3")
      sample.user = current_user
      if sample.save
        samples << sample
      else
        errors << sample.errors
      end
    end

    metadata_errors = upload_metadata_for_samples(samples, metadata)

    errors.concat(metadata_errors)

    {
      "errors" => errors,
      # Need to refetch samples so sample.metadata is fresh.
      "samples" => Sample.where(id: samples.pluck(:id))
    }
  end

  def samples_by_domain(domain)
    case domain
    when "library"
      # samples for projects that user owns
      current_power.library_samples
    when "public"
      # samples for public projects
      Sample.public_samples
    else
      # all samples user can see
      current_power.samples
    end
  end

  def samples_by_metadata_field(sample_ids, field_name)
    return Metadatum
           .joins(:metadata_field)
           .where(
             metadata_fields: { name: field_name },
             sample_id: sample_ids
           )
           .group(Metadatum.where(key: field_name).first.validated_field)
  end

  private

  def filter_by_time(samples, start_date, end_date)
    samples.where("samples.created_at >= ? AND samples.created_at <= ?", start_date, end_date)
  end

  def filter_by_visibility(samples, visibility)
    if visibility
      public = visibility.include?("public")
      private = visibility.include?("private")

      if public ^ private
        if public
          return samples.public_samples
        else
          return samples.private_samples
        end
      end
    end

    samples
  end

  def filter_by_metadata_key(samples, key, query)
    # TODO(tiago): replace 'filter_by_metadatum' once we decide to includeing not set values
    metadata_field = Metadatum.where(key: key).first

    samples_with_metadata = samples
      .includes(metadata: :metadata_field)
      .where(metadata: { metadata_field_id: metadata_field.metadata_field_id })

    samples_filtered = samples_with_metadata
      .where(metadata: { metadata_field.validated_field => query })

    not_set_ids = []
    if query.include?("not_set")
      not_set_ids = samples.pluck(:id) - samples_with_metadata.pluck(:id)
    end

    samples.where(id: [samples_filtered.pluck(:id)].concat(not_set_ids))
  end

  def filter_by_host(samples, query)
    return samples.where("false") if query == ["none"]
    samples.where(host_genome_id: query)
  end

  def filter_by_taxid(samples, taxid)
    pr_ids = TaxonByterange.where(taxid: taxid).pluck(:pipeline_run_id)
    sample_ids = PipelineRun.top_completed_runs.where(id: pr_ids).pluck(:sample_id)
    samples.where(id: sample_ids)
  end
end
