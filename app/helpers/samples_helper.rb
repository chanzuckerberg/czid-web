require 'open3'
require 'csv'
require 'aws-sdk-s3'

module SamplesHelper
  include PipelineOutputsHelper
  include PipelineRunsHelper
  include ErrorHelper

  # We set S3_GLOBAL_ENDPOINT to enable cross-region listing in
  # parsed_samples_for_s3_path. By default S3::Client sets a regional endpoint
  # such as s3.us-west-2.amazonaws.com (from the config) and errs if you use a
  # bucket in a different region.
  S3_CLIENT_LOCAL = Aws::S3::Client.new(endpoint: S3_GLOBAL_ENDPOINT)
  # Limit the number of objects we scan in a bucket to avoid timeouts and memory issues.
  S3_OBJECT_LIMIT = 10_000

  # Sample files stored in S3 have paths like s3://idseq-samples-prod/samples/{project_id}/{sample_id}/{path_to_file}
  # This regex extracts the sample_id from sample S3 paths.
  SAMPLE_PATH_ID_MATCHER = %r{\A.*samples\/\d*\/(\d*)\/.*\z}

  def generate_sample_list_csv(formatted_samples)
    attributes = %w[sample_name uploader upload_date overall_job_status runtime_seconds
                    total_reads nonhost_reads nonhost_reads_percent total_ercc_reads subsampled_fraction
                    quality_control compression_ratio reads_after_star reads_after_trimmomatic reads_after_priceseq reads_after_cdhitdup
                    sample_type nucleotide_type collection_location
                    host_genome notes]
    CSVSafe.generate(headers: true) do |csv|
      csv << attributes
      formatted_samples.each do |sample_info|
        derived_output = sample_info[:derived_sample_output]
        pipeline_run = derived_output[:pipeline_run]
        db_sample = sample_info[:db_sample]
        run_info = sample_info[:run_info]
        metadata = sample_info[:metadata]
        collection_location = if metadata && metadata[:collection_location_v2]
                                metadata[:collection_location_v2].is_a?(Hash) ? metadata[:collection_location_v2].dig(:name) : metadata[:collection_location_v2]
                              else
                                ''
                              end
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
                        reads_after_star: (derived_output[:summary_stats] || {})[:reads_after_star] || '',
                        reads_after_trimmomatic: (derived_output[:summary_stats] || {})[:reads_after_trimmomatic] || '',
                        reads_after_priceseq: (derived_output[:summary_stats] || {})[:reads_after_priceseq] || '',
                        reads_after_cdhitdup: (derived_output[:summary_stats] || {})[:reads_after_cdhitdup] || '',
                        sample_type: metadata && metadata[:sample_type] ? metadata[:sample_type] : '',
                        nucleotide_type: metadata && metadata[:nucleotide_type] ? metadata[:nucleotide_type] : '',
                        # Handle both location objects w/name and strings
                        collection_location: collection_location,
                        host_genome: derived_output && derived_output[:host_genome_name] ? derived_output[:host_genome_name] : '',
                        notes: db_sample && db_sample[:sample_notes] ? db_sample[:sample_notes] : '', }
        attributes_as_symbols = attributes.map(&:to_sym)
        csv << data_values.values_at(*attributes_as_symbols)
      end
    end
  end

  def host_genomes_list
    HostGenome.all.map { |h| h.slice('name', 'id') }
  end

  def get_summary_stats(job_stats_hash, pipeline_run)
    pr = pipeline_run
    unmapped_reads = pr.nil? ? nil : pr.unmapped_reads
    last_processed_at = pr.nil? ? nil : pr.created_at
    result = {
      adjusted_remaining_reads: get_adjusted_remaining_reads(pr),
      compression_ratio: compute_compression_ratio(job_stats_hash),
      qc_percent: compute_qc_value(job_stats_hash),
      percent_remaining: compute_percentage_reads(pr),
      unmapped_reads: unmapped_reads,
      last_processed_at: last_processed_at,
    }
    ["star", "trimmomatic", "priceseq", "cdhitdup"].each do |step|
      result["reads_after_#{step}".to_sym] = (job_stats_hash["#{step}_out"] || {})["reads_after"]
    end
    result
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
                           status: 'created', }

    parsed_uri = URI.parse(s3_path)
    return if parsed_uri.scheme != "s3"

    s3_bucket_name = parsed_uri.host
    return if s3_bucket_name.nil?

    s3_prefix = parsed_uri.path.sub(%r{^/(.*?)/?$}, '\1/')

    begin
      s3 = Aws::S3::Resource.new(client: S3_CLIENT_LOCAL)
      bucket = s3.bucket(s3_bucket_name)
      entries = bucket.objects(prefix: s3_prefix).limit(S3_OBJECT_LIMIT).map(&:key)
      if entries.length >= S3_OBJECT_LIMIT
        Rails.logger.info("User tried to list more than #{S3_OBJECT_LIMIT} objects in #{s3_path}")
      end
      # ignore illumina Undetermined FASTQ files (ex: "Undetermined_AAA_R1_001.fastq.gz")
      entries = entries.reject { |line| line.include? "Undetermined" }
    rescue Aws::S3::Errors::ServiceError => e # Covers all S3 access errors (AccessDenied/NoSuchBucket/AllAccessDisabled)
      Rails.logger.info("parsed_samples_for_s3_path Aws::S3::Errors::ServiceError. s3_path: #{s3_path}, error_class: #{e.class.name}, error_message: #{e.message} ")
      return
    end

    samples = {}
    entries.each do |s3_entry|
      file_name = File.basename(s3_entry)
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
      name = matched[1]
      samples[name] ||= default_attributes.clone
      samples[name][:input_files_attributes] ||= []
      samples[name][:input_files_attributes][read_idx] = { name: file_name,
                                                           source: "s3://#{s3_bucket_name}/#{s3_entry}",
                                                           source_type: InputFile::SOURCE_TYPE_S3, }
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
    location_v2 = params[:locationV2]
    taxon = params[:taxon]
    time = params[:time]
    # Keep "tissue" for legacy compatibility. It's too hard to rename all JS
    # instances to "sample_type"
    sample_type = params[:tissue]
    visibility = params[:visibility]
    project_id = params[:projectId]
    search_string = params[:search]
    requested_sample_ids = params[:sampleIds]

    samples = samples.where(project_id: project_id) if project_id.present?
    samples = filter_by_taxid(samples, taxon) if taxon.present?
    samples = filter_by_host(samples, host) if host.present?
    samples = filter_by_metadata_key(samples, "collection_location", location) if location.present?
    samples = filter_by_metadata_key(samples, "collection_location_v2", location_v2) if location_v2.present?
    samples = filter_by_time(samples, Date.parse(time[0]), Date.parse(time[1])) if time.present?
    samples = filter_by_metadata_key(samples, "sample_type", sample_type) if sample_type.present?
    samples = filter_by_visibility(samples, visibility) if visibility.present?
    samples = filter_by_search_string(samples, search_string) if search_string.present?
    samples = filter_by_sample_ids(samples, requested_sample_ids) if requested_sample_ids.present?

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
      (run_stages || []).map { |rs| rs.updated_at - rs.created_at }.sum
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
    metadata_by_sample_id = Metadatum.by_sample_ids(samples.map(&:id), use_raw_date_strings: true)
    return samples.map do |sample|
      {
        name: sample.name,
        id: sample.id,
        host_genome_id: sample.host_genome_id,
        metadata: metadata_by_sample_id[sample.id],
      }
    end
  end

  def format_samples(samples, pipeline_runs_by_sample_id = nil)
    formatted_samples = []
    return formatted_samples if samples.empty?

    # Do major SQL queries
    sample_ids = samples.map(&:id)
    top_pipeline_run_by_sample_id = pipeline_runs_by_sample_id || top_pipeline_runs_multiget(sample_ids)
    pipeline_run_ids = top_pipeline_run_by_sample_id.values.map(&:id)
    job_stats_by_pipeline_run_id = job_stats_multiget(pipeline_run_ids)
    report_ready_pipeline_run_ids = report_ready_multiget(pipeline_run_ids)
    pipeline_run_stages_by_pipeline_run_id = dependent_records_multiget(PipelineRunStage, :pipeline_run_id, pipeline_run_ids)
    output_states_by_pipeline_run_id = dependent_records_multiget(OutputState, :pipeline_run_id, pipeline_run_ids)
    metadata_by_sample_id = Metadatum.by_sample_ids(sample_ids, use_raw_date_strings: true)

    # Massage data into the right format
    samples.includes(:pipeline_runs, :host_genome, :project, :input_files, :user).each_with_index do |sample|
      job_info = {}
      job_info[:db_sample] = sample
      job_info[:metadata] = metadata_by_sample_id[sample.id]
      top_pipeline_run = top_pipeline_run_by_sample_id[sample.id]
      job_stats_hash = top_pipeline_run ? job_stats_by_pipeline_run_id[top_pipeline_run.id] : {}
      job_info[:derived_sample_output] = sample_derived_data(sample, top_pipeline_run, job_stats_hash)
      job_info[:run_info] = if sample.upload_error && sample.upload_error == Sample::DO_NOT_PROCESS
                              {
                                result_status_description: 'SKIPPED',
                                finalized: 0,
                                report_ready: 0,
                              }
                            elsif sample.upload_error && sample.upload_error != Sample::UPLOAD_ERROR_LOCAL_UPLOAD_STALLED
                              {
                                result_status_description: 'FAILED',
                                finalized: 0,
                                report_ready: 0,
                              }
                            else
                              pipeline_run_info(top_pipeline_run, report_ready_pipeline_run_ids,
                                                pipeline_run_stages_by_pipeline_run_id, output_states_by_pipeline_run_id)
                            end
      job_info[:uploader] = sample_uploader(sample)
      formatted_samples.push(job_info)
    end
    formatted_samples
  end

  def get_visibility(samples)
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
    distinct_host_genomes = samples.map(&:host_genome).uniq

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

        status = sample.ensure_metadata_field_for_key(key)

        # Reload each host genome whenever a custom field is created,
        # so that host_genome.metadata_fields is fresh.
        # This is necessary because we sometimes use ActiveRecord.includes on the "samples" parameter
        # before passing it in.
        if status == "custom"
          distinct_host_genomes.each(&:reload)
        end

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
    # With on_duplicate_key_update, activerecord-import will correctly update existing rows.
    # Rails model validations are also checked.
    update_keys = [:raw_value, :string_validated_value, :number_validated_value, :date_validated_value, :location_id]
    results = Metadatum.import metadata_to_save, validate: true, on_duplicate_key_update: update_keys
    results.failed_instances.each do |model|
      errors.push(MetadataUploadErrors.save_error(model.key, model.raw_value))
    end

    errors
  end

  def upload_samples_with_metadata(samples_to_upload, metadata, user)
    samples = []
    errors = []
    samples_to_upload.each do |sample_attributes|
      # A sample won't have input files if and only if it is being uploaded from basespace.
      if sample_attributes[:input_files_attributes]
        sample_attributes[:input_files_attributes].reject! { |f| f["source"] == '' }
      elsif !sample_attributes[:basespace_access_token] || !sample_attributes[:basespace_dataset_id]
        errors << SampleUploadErrors.missing_input_files_or_basespace_params(sample_attributes[:name])
        # Remove the metadata for the invalid sample.
        metadata.delete(sample_attributes[:name])
        next
      end

      if sample_attributes[:host_genome_name]
        name = sample_attributes.delete(:host_genome_name)
        sample_attributes[:host_genome_id] = HostGenome.find_by(name: name).id
      end
      sample = Sample.new(sample_attributes)
      sample.input_files.each { |f| f.name ||= File.basename(f.source) }

      # Add these as temporary attributes to this sample object.
      if sample_attributes[:basespace_access_token]
        sample.basespace_access_token = sample_attributes.delete(:basespace_access_token)
        sample.uploaded_from_basespace = 1
      end
      if sample_attributes[:basespace_dataset_id]
        sample.basespace_dataset_id = sample_attributes.delete(:basespace_dataset_id)
      end

      # If s3 upload, set "bulk_mode" to true.
      sample.bulk_mode = sample.input_files.map(&:source_type).include?("s3")
      sample.status = Sample::STATUS_CREATED
      sample.user = user
      if sample.save
        samples << sample
      else
        errors << sample.errors
        # Remove the metadata for the invalid sample.
        metadata.delete(sample_attributes[:name])
      end
    end

    metadata_errors = upload_metadata_for_samples(samples, metadata)

    errors.concat(metadata_errors)

    {
      "errors" => errors,
      # Need to refetch samples so sample.metadata is fresh.
      "samples" => Sample.where(id: samples.pluck(:id)),
    }
  end

  def samples_by_domain(domain)
    case domain
    when "my_data"
      # samples for projects that user owns
      current_power.my_data_samples
    when "public"
      # samples for public projects
      Sample.public_samples
    else
      # all samples user can see
      current_power.samples
    end
  end

  def self.samples_by_metadata_field(sample_ids, field_name)
    query = Metadatum.where(metadata_fields: { name: field_name }, sample_id: sample_ids)
    metadata_field = MetadataField.find_by(name: field_name)

    # Special-case locations
    if metadata_field.base_type == MetadataField::LOCATION_TYPE
      query
        .includes(:metadata_field, location: Location::GEO_LEVELS)
        .group(
          [
            :string_validated_value,
            "locations.name",
          ] + Location::GEO_LEVELS.map { |l| "#{l.pluralize}_locations.name" }
        )
    else
      query
        .includes(:metadata_field)
        .group(metadata_field.validated_field)
    end
  end

  # For each taxon, count how many samples have reads for that taxon.
  # Add these counts to the taxon objects.
  def add_sample_count_to_taxa_with_reads(taxon_list, samples)
    tax_ids = taxon_list.map { |taxon| taxon["taxid"] }
    pipeline_run_ids = get_succeeded_pipeline_runs_for_samples(samples).pluck(:id)
    counts_by_taxid = TaxonCount
                      .where(tax_id: tax_ids, pipeline_run_id: pipeline_run_ids)
                      .group(:tax_id)
                      .select("tax_id, COUNT(DISTINCT pipeline_run_id) as sample_count")
                      .map { |r| [r.tax_id, r.sample_count] }
                      .to_h
    taxon_list.each do |taxon|
      taxon["sample_count"] = counts_by_taxid[taxon["taxid"]] || 0
    end
    taxon_list
  end

  # For each taxon, count how many samples have contigs for that taxon.
  # Add these counts to the taxon objects.
  def add_sample_count_to_taxa_with_contigs(taxon_list, samples)
    get_tax_ids_by_level = lambda do |level|
      taxon_list.select { |taxon| taxon["level"] == level }.map { |taxon| taxon["taxid"] }
    end

    species_tax_ids = nil
    genus_tax_ids = nil
    pipeline_run_ids = nil
    pipeline_runs_by_taxid = nil

    process_tax_ids = lambda do |level, type|
      tax_id_field = "#{level}_taxid_#{type}"
      tax_ids = level == "species" ? species_tax_ids : genus_tax_ids

      if tax_ids.empty?
        return
      end

      # We just need the distinct pairs to do our counting, not the individual contigs.
      Contig
        .where(pipeline_run_id: pipeline_run_ids, "#{tax_id_field}": tax_ids)
        .select("DISTINCT pipeline_run_id, #{tax_id_field}")
        .each { |contig| pipeline_runs_by_taxid[contig[tax_id_field]] << contig.pipeline_run_id }
    end

    # Separate genus and species taxids. We query them separately to try to get some extra performance.
    species_tax_ids = get_tax_ids_by_level.call("species")
    genus_tax_ids = get_tax_ids_by_level.call("genus")

    pipeline_run_ids = get_succeeded_pipeline_runs_for_samples(samples).pluck(:id)

    # We maintain a hash of taxid => array of pipeline run ids. We de-dupe the pipeline run ids at the very end.
    pipeline_runs_by_taxid = Hash.new { |h, k| h[k] = [] } # Keys are auto-initialized to the empty array.

    process_tax_ids.call("species", "nr")
    process_tax_ids.call("species", "nt")
    process_tax_ids.call("genus", "nr")
    process_tax_ids.call("genus", "nt")

    taxon_list.each do |taxon|
      # De-dupe the pipeline run ids before taking the length.
      taxon["sample_count"] = pipeline_runs_by_taxid[taxon["taxid"]].uniq.length
    end
    taxon_list
  end

  def self.get_sample_count_from_sample_paths(urls)
    sample_ids = Set.new

    urls.each do |url|
      if (matches = SAMPLE_PATH_ID_MATCHER.match(url))
        sample_id = matches[1]
        sample_ids.add(sample_id)
      end
    end

    sample_ids.size
  end

  private

  def filter_by_time(samples, start_date, end_date)
    samples.where("samples.created_at >= ? AND samples.created_at <= ?", start_date.beginning_of_day, end_date.end_of_day)
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
    # TODO(tiago): replace 'filter_by_metadatum' once we decide about including not set values
    metadatum = Metadatum.where(key: key).first

    samples_with_metadata = samples
                            .includes(metadata: :metadata_field)
                            .where(metadata: { metadata_field_id: metadatum.metadata_field_id })

    samples_filtered = if metadatum.metadata_field.base_type == MetadataField::LOCATION_TYPE
                         LocationHelper.filter_by_name(samples_with_metadata, query)
                       else
                         samples_with_metadata
                           .where(metadata: { metadatum.metadata_field.validated_field => query })
                       end

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
    # Nested query guarantees that we will not get duplicate samples
    # despite joins to pipeline_runs and taxon_counts
    samples
      .where(id: samples
        .distinct(:id)
        .joins(:pipeline_runs, pipeline_runs: :taxon_counts)
        .where(pipeline_runs: { id: PipelineRun.joins(:sample).where(sample: samples, job_status: "CHECKED").group(:sample_id).select("MAX(`pipeline_runs`.id) AS id") })
        .where(taxon_counts: { tax_id: taxid, count_type: ["NT", "NR"] })
        .where("`taxon_counts`.count > 0"))
  end

  def filter_by_search_string(samples, search_string)
    samples.search_by_name(search_string)
  end

  def filter_by_sample_ids(samples, requested_sample_ids)
    requested_sample_ids.class.name
    samples.where(id: requested_sample_ids.is_a?(Array) ? requested_sample_ids : JSON.parse(requested_sample_ids))
  end
end
