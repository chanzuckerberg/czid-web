module BulkDownloadsHelper
  include PipelineRunsHelper

  SAMPLE_NO_PERMISSION_ERROR = "You do not have permission to access all of the selected samples. Please contact us for help.".freeze
  WORKFLOW_RUN_NO_PERMISSION_ERROR = "You do not have permission to access all of the selected workflow runs. Please contact us for help.".freeze
  SAMPLE_STILL_RUNNING_ERROR = "Some selected samples have not finished running yet. Please remove these samples and try again.".freeze
  SAMPLE_FAILED_ERROR = "Some selected samples failed their most recent run. Please remove these samples and try again.".freeze
  MAX_OBJECTS_EXCEEDED_ERROR_TEMPLATE = "No more than %s objects allowed in one download.".freeze
  BULK_DOWNLOAD_NOT_FOUND = "No bulk download was found with this id.".freeze
  OUTPUT_FILE_NOT_SUCCESSFUL = "Bulk download has not succeeded. Can't get output file url.".freeze
  INVALID_ACCESS_TOKEN = "The access token was invalid for this bulk download.".freeze
  KICKOFF_FAILURE = "Unexpected error kicking off bulk download.".freeze
  KICKOFF_FAILURE_HUMAN_READABLE = "Could not kick off bulk download. Please contact us for help.".freeze
  PRESIGNED_URL_GENERATION_ERROR = "Could not generate a presigned url.".freeze
  SUCCESS_URL_REQUIRED = "Success url required for bulk download.".freeze
  FAILED_SAMPLES_ERROR_TEMPLATE = "%s samples could not be processed. Please contact us for help.".freeze
  UNKNOWN_EXECUTION_TYPE = "Could not find execution type for bulk download".freeze
  UNKNOWN_DOWNLOAD_TYPE = "Could not find download type for bulk download".freeze
  ADMIN_ONLY_DOWNLOAD_TYPE = "You must be an admin to initiate this download type.".freeze
  UPLOADER_ONLY_DOWNLOAD_TYPE = "You must be the uploader of all selected samples to initiate this download type.".freeze
  BULK_DOWNLOAD_GENERATION_FAILED = "Could not generate bulk download".freeze
  READS_NON_HOST_TAXON_LINEAGE_EXPECTED_TEMPLATE = "Unexpected error. Could not find valid taxon lineage for taxid %s".freeze

  # Check that all pipeline runs have succeeded for the provided samples
  # and return the pipeline run ids.
  # Raise an error if any pipeline runs have not succeeded.
  def get_valid_pipeline_run_ids_for_samples(samples)
    begin
      pipeline_runs = get_succeeded_pipeline_runs_for_samples(samples, true)
    rescue StandardError => e
      # Convert the error to a human-readable error.
      if e.message == PipelineRunsHelper::PIPELINE_RUN_STILL_RUNNING_ERROR
        raise SAMPLE_STILL_RUNNING_ERROR
      elsif e.message == PipelineRunsHelper::PIPELINE_RUN_FAILED_ERROR
        raise SAMPLE_FAILED_ERROR
      else
        LogUtil.log_error("BulkDownloadsFailedEvent: Unexpected issue getting valid pipeline runs for samples: #{e}", exception: e, samples: samples)
        raise
      end
    end

    return pipeline_runs.map(&:id)
  end

  def format_bulk_download(bulk_download, detailed: false, admin: false)
    number_of_pipeline_runs = bulk_download.pipeline_runs.length

    # TODO: Adapt to a hash structure when a new workflow is introduced or when we can create
    # bulk downloads from multiple workflows. This approach works because we can create
    # a bulk download from one and only one workflow.
    workflow, count = if number_of_pipeline_runs > 0
                        [WorkflowRun::WORKFLOW[:short_read_mngs], number_of_pipeline_runs]
                      else
                        [WorkflowRun::WORKFLOW[:consensus_genome], bulk_download.workflow_runs.length]
                      end

    formatted_bulk_download = bulk_download.as_json(except: [:access_token])
    formatted_bulk_download[:analysis_type] = workflow
    formatted_bulk_download[:analysis_count] = count

    formatted_bulk_download[:num_samples] = (bulk_download.pipeline_runs.pluck(:sample_id) + bulk_download.workflow_runs.pluck(:sample_id)).uniq.length
    formatted_bulk_download[:download_name] = bulk_download.download_display_name
    formatted_bulk_download[:file_size] = ActiveSupport::NumberHelper.number_to_human_size(bulk_download.output_file_size)
    if admin
      formatted_bulk_download[:user_name] = bulk_download.user&.name
      formatted_bulk_download[:execution_type] = bulk_download.execution_type
      formatted_bulk_download[:log_url] = bulk_download.log_url
    end

    # params is not included by default, because it's a wrapper variable around params_json.
    unless bulk_download.params.nil?
      formatted_bulk_download[:params] = bulk_download.params
    end

    if detailed
      detail_sources = [[:pipeline_runs, bulk_download.pipeline_runs], [:workflow_runs, bulk_download.workflow_runs]]
      detail_sources.map do |symbol, data_source|
        formatted_bulk_download[symbol] = data_source.map do |run|
          {
            "id": run.id,
            "sample_name": run.sample.name,
          }
        end
      end

      formatted_bulk_download[:presigned_output_url] = bulk_download.output_file_presigned_url
    end
    formatted_bulk_download
  end

  def validate_num_objects(num_objects, app_config_key)
    # Max objects (samples or workflow runs) check.
    max_objects_allowed = get_app_config(app_config_key)

    # Max objects should be string containing an integer, but just in case.
    if max_objects_allowed.nil?
      raise BulkDownloadsHelper::KICKOFF_FAILURE_HUMAN_READABLE
    end

    if num_objects > Integer(max_objects_allowed) && !current_user.admin?
      raise BulkDownloadsHelper::MAX_OBJECTS_EXCEEDED_ERROR_TEMPLATE % max_objects_allowed
    end
  end

  # Will raise errors if any validation fails.
  # Returns viewable objects (samples or workflow runs) in the bulk download.
  def validate_bulk_download_create_params(create_params, user)
    current_power = Power.new(user)
    sample_ids = create_params[:sample_ids]
    workflow_run_ids = create_params[:workflow_run_ids]

    # Check that user can view all the objects being downloaded.
    if sample_ids.present?
      num_objects = sample_ids.count
      viewable_objects = current_power.viewable_samples.where(id: sample_ids)
      objects_count = sample_ids.length
    elsif workflow_run_ids.present?
      num_objects = workflow_run_ids.count
      viewable_objects = current_power.workflow_runs.where(id: workflow_run_ids)
      objects_count = workflow_run_ids.length
    end

    if create_params[:download_type] == BulkDownloadTypesHelper::ORIGINAL_INPUT_FILE_BULK_DOWNLOAD_TYPE
      validate_num_objects(num_objects, AppConfig::MAX_SAMPLES_BULK_DOWNLOAD_ORIGINAL_FILES)
    else
      validate_num_objects(num_objects, AppConfig::MAX_OBJECTS_BULK_DOWNLOAD)
    end

    if objects_count != viewable_objects.count
      raise BulkDownloadsHelper::SAMPLE_NO_PERMISSION_ERROR if sample_ids.present?
      raise BulkDownloadsHelper::WORKFLOW_RUN_NO_PERMISSION_ERROR if workflow_run_ids.present?
    end

    type_data = BulkDownloadTypesHelper::BULK_DOWNLOAD_TYPE_NAME_TO_DATA[create_params[:download_type]]

    if type_data.nil?
      raise BulkDownloadsHelper::UNKNOWN_DOWNLOAD_TYPE
    end

    if type_data[:admin_only] && !user.admin?
      raise BulkDownloadsHelper::ADMIN_ONLY_DOWNLOAD_TYPE
    end

    if type_data[:uploader_only] && !user.admin?
      my_objects = sample_ids.present? ? current_power.viewable_samples.where(user: user, id: sample_ids) : current_power.workflow_runs.created_by(user).where(id: workflow_run_ids)
      raise BulkDownloadsHelper::UPLOADER_ONLY_DOWNLOAD_TYPE if objects_count != my_objects.length
    end

    return viewable_objects
  end

  # Generate the metric values matrix.
  def self.generate_metric_values(taxon_counts_by_pr, _samples, metric)
    metric_values = {}
    # Maintain a hash of all the taxons we've encountered.
    taxids_to_name = {}

    # metric is a string like NT.rpm. Convert it to ["NT", "rpm"]
    metric_path = metric.split(".")

    # Build up the metric_value matrix.
    taxon_counts_by_pr.each do |_pr_id, results|
      # results contains taxon counts, plus the pipeline run object and sample id.
      results_taxon_counts = results["taxon_counts"]
      sample_id = results["sample_id"]

      # Importantly, remove any homo sapiens counts.
      taxid_to_taxon_counts = ReportHelper.taxon_counts_cleanup(results_taxon_counts)
      # Only consider species level counts.
      HeatmapHelper.only_species_level_counts!(taxid_to_taxon_counts)

      sample_metric_values = {}

      taxid_to_taxon_counts.each do |taxid, taxon_counts|
        metric_value = taxon_counts.dig(*metric_path)

        # Don't include 0 values for reads or rPM metrics.
        # Include ALL values for zscore metrics for now, because it's less clear what to omit,
        # since zscore can be nonzero even if the corresponding read count was zero.
        if metric_value > 0 || metric == "NT.zscore" || metric == "NR.zscore"
          sample_metric_values[taxid] = metric_value
          taxids_to_name[taxid] = taxon_counts["name"]
        end
      end

      metric_values[sample_id] = sample_metric_values
    end

    {
      metric_values: metric_values,
      taxids_to_name: taxids_to_name,
    }
  end

  # This method models HeatmapHelper.sample_taxons_dict when fetching metrics. It uses the necessary logic from that function.
  def self.generate_combined_sample_taxon_results_csv(samples, background_id, metric)
    # First, fetch all the data.

    # For each sample, fetch taxon counts for that sample.
    # By default, fetches top 1,000,000 taxons for each sample.
    taxon_counts_by_pr = HeatmapHelper.fetch_top_taxons(
      samples,
      background_id,
      min_reads: 0 # minimum read threshold
    )

    # Generate the metric values matrix.
    # Also generate a hash of all encountered taxids to their taxonomy name.
    metric_values, taxids_to_name = BulkDownloadsHelper.generate_metric_values(taxon_counts_by_pr, samples, metric)
                                                       .values_at(:metric_values, :taxids_to_name)

    # Filter out any samples which could not be fetched or had no valid columns.
    successful_samples, failed_samples = samples.to_a.partition { |sample| metric_values[sample.id].present? }

    # Generate the CSV.
    csv_str = CSVSafe.generate(headers: true) do |csv|
      # Add the headers.
      csv << ["Taxon Name"] + successful_samples.pluck(:name)

      # Add the rows.
      taxids_to_name.each do |taxid, taxon_name|
        row = []
        row << taxon_name

        successful_samples.each do |sample|
          # Default to empty string for taxa that weren't found.
          row << metric_values[sample.id][taxid] || nil
        end

        csv << row
      end
    end

    {
      csv_str: csv_str,
      failed_sample_ids: failed_samples.pluck(:id),
    }
  end

  # This method generates the csv for the metadata bulk download.
  def self.generate_metadata_csv(samples)
    metadata_headers, metadata_keys, metadata_by_sample_id = BulkDownloadsHelper.generate_sample_metadata_csv_info(samples: samples)

    CSVSafe.generate(headers: true) do |csv|
      csv << ["sample_name"] + metadata_headers
      samples.each do |sample|
        metadata = metadata_by_sample_id[sample.id] || {}
        csv << [sample.name] + metadata.values_at(*metadata_keys)
      end
    end
  end

  def self.generate_cg_overview_csv(workflow_runs:, include_metadata: false)
    csv_headers = ["Sample Name", "Reference Accession", "Reference Accession ID", *ConsensusGenomeMetricsService::ALL_METRICS.values]

    if include_metadata
      samples = Sample.where(id: workflow_runs.pluck(:sample_id).uniq)
      metadata_headers, metadata_keys, metadata_by_sample_id = BulkDownloadsHelper.generate_sample_metadata_csv_info(samples: samples)
      cg_metadata_headers = ["Wetlab Protocol", "Executed At"]
      csv_headers.concat(cg_metadata_headers, metadata_headers.map { |h| h.humanize.titleize })
    end

    CSVSafe.generate(headers: true) do |csv|
      csv << csv_headers

      workflow_runs.includes(:sample).each do |wr|
        cg_metric_csv_values = BulkDownloadsHelper.prepare_workflow_run_metrics_csv_info(workflow_run: wr)
        csv_values = [wr.sample.name, wr.inputs&.[]("accession_name"), wr.inputs&.[]("accession_id")] + cg_metric_csv_values

        if include_metadata
          metadata = metadata_by_sample_id[wr.sample.id] || {}
          sample_metadata_csv_values = metadata.values_at(*metadata_keys)
          cg_metadata_csv_values = [wr.inputs&.[]("wetlab_protocol") || '', wr.executed_at]
          csv_values.concat(cg_metadata_csv_values, sample_metadata_csv_values)
        end

        csv << csv_values
      end
    end
  end

  def self.prepare_workflow_run_metrics_csv_info(workflow_run:)
    parsed_cached_results = workflow_run.parsed_cached_results
    quality_metrics = parsed_cached_results&.[]("quality_metrics") if parsed_cached_results.present?

    if quality_metrics.present?
      return quality_metrics.values_at(*ConsensusGenomeMetricsService::ALL_METRICS.keys.map(&:to_s))
    end

    # Most likely will not reach this line since the frontend excludes samples that failed/have issues from bulk downloads
    return (0...ConsensusGenomeMetricsService::ALL_METRICS.keys.length).map { |_| '' }
  end

  def self.generate_sample_metadata_csv_info(samples:)
    metadata_fields = MetadataHelper.get_unique_metadata_fields_for_samples(samples)
    # Order the metadata fields so that required fields are first.
    metadata_fields = MetadataHelper.order_metadata_fields_for_csv(metadata_fields)
    metadata_headers = MetadataHelper.get_csv_headers_for_metadata_fields(metadata_fields)
    metadata_keys = metadata_fields.pluck(:name).map(&:to_sym)

    sample_ids = samples.pluck(:id)
    metadata_by_sample_id = Metadatum.by_sample_ids(sample_ids, use_csv_compatible_values: true)
    host_genome_by_sample_id = samples.map { |sample| [sample.id, sample.host_genome_name] }.to_h

    # Convert metadata to HIPAA-compliant values
    metadata_by_sample_id.each do |sample_id, sample_metadata|
      host_is_human = host_genome_by_sample_id[sample_id] == "Human"
      host_age_above_max = sample_metadata.key?(:host_age) && sample_metadata[:host_age].to_i >= MetadataField::MAX_HUMAN_AGE
      if host_is_human && host_age_above_max
        sample_metadata[:host_age] = "≥ #{MetadataField::MAX_HUMAN_AGE}"
      end
    end

    return [metadata_headers, metadata_keys, metadata_by_sample_id]
  end
end
