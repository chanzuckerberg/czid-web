module BulkDownloadsHelper
  include PipelineRunsHelper

  SAMPLE_NO_PERMISSION_ERROR = "You do not have permission to access all of the selected samples. Please contact us for help.".freeze
  SAMPLE_STILL_RUNNING_ERROR = "Some selected samples have not finished running yet. Please remove these samples and try again.".freeze
  SAMPLE_FAILED_ERROR = "Some selected samples failed their most recent run. Please remove these samples and try again.".freeze
  MAX_SAMPLES_EXCEEDED_ERROR_TEMPLATE = "No more than %s samples allowed in one download.".freeze
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
    rescue => e
      # Convert the error to a human-readable error.
      if e.message == PipelineRunsHelper::PIPELINE_RUN_STILL_RUNNING_ERROR
        raise SAMPLE_STILL_RUNNING_ERROR
      elsif e.message == PipelineRunsHelper::PIPELINE_RUN_FAILED_ERROR
        raise SAMPLE_FAILED_ERROR
      else
        LogUtil.log_err_and_airbrake("BulkDownloadsFailedEvent: Unexpected issue getting valid pipeline runs for samples: #{e}")
        raise
      end
    end

    return pipeline_runs.map(&:id)
  end

  def format_bulk_download(bulk_download, detailed: false, admin: false)
    formatted_bulk_download = bulk_download.as_json(except: [:access_token])
    formatted_bulk_download[:num_samples] = bulk_download.pipeline_runs.length
    formatted_bulk_download[:download_name] = bulk_download.download_display_name
    formatted_bulk_download[:file_size] = ActiveSupport::NumberHelper.number_to_human_size(bulk_download.output_file_size)
    if admin
      formatted_bulk_download[:user_name] = bulk_download.user.name
      formatted_bulk_download[:execution_type] = bulk_download.execution_type
      formatted_bulk_download[:log_url] = bulk_download.log_url
    end

    # params is not included by default, because it's a wrapper variable around params_json.
    unless bulk_download.params.nil?
      formatted_bulk_download[:params] = bulk_download.params
    end

    if detailed
      formatted_bulk_download[:pipeline_runs] = bulk_download.pipeline_runs.map do |pipeline_run|
        {
          "id": pipeline_run.id,
          "sample_name": pipeline_run.sample.name,
        }
      end

      formatted_bulk_download[:presigned_output_url] = bulk_download.output_file_presigned_url
    end
    formatted_bulk_download
  end

  def validate_num_samples(num_samples, app_config_key)
    # Max samples check.
    max_samples_allowed = get_app_config(app_config_key)

    # Max samples should be string containing an integer, but just in case.
    if max_samples_allowed.nil?
      raise BulkDownloadsHelper::KICKOFF_FAILURE_HUMAN_READABLE
    end

    if num_samples > Integer(max_samples_allowed) && !current_user.admin?
      raise BulkDownloadsHelper::MAX_SAMPLES_EXCEEDED_ERROR_TEMPLATE % max_samples_allowed
    end
  end

  # Will raise errors if any validation fails.
  # Returns pipeline_run_ids for the samples in the bulk download.
  def validate_bulk_download_create_params(create_params, user)
    sample_ids = create_params[:sample_ids]

    if create_params[:download_type] == BulkDownloadTypesHelper::ORIGINAL_INPUT_FILE_BULK_DOWNLOAD_TYPE
      validate_num_samples(sample_ids.length, AppConfig::MAX_SAMPLES_BULK_DOWNLOAD_ORIGINAL_FILES)
    else
      validate_num_samples(sample_ids.length, AppConfig::MAX_SAMPLES_BULK_DOWNLOAD)
    end

    # Check that user can view all the samples being downloaded.
    viewable_samples = current_power.viewable_samples.where(id: sample_ids)
    if viewable_samples.length != sample_ids.length
      raise BulkDownloadsHelper::SAMPLE_NO_PERMISSION_ERROR
    end

    type_data = BulkDownloadTypesHelper::BULK_DOWNLOAD_TYPE_NAME_TO_DATA[create_params[:download_type]]

    if type_data.nil?
      raise BulkDownloadsHelper::UNKNOWN_DOWNLOAD_TYPE
    end

    if type_data[:admin_only] && !user.admin?
      raise BulkDownloadsHelper::ADMIN_ONLY_DOWNLOAD_TYPE
    end

    if type_data[:uploader_only] && !user.admin?
      samples = Sample.where(user: user, id: sample_ids)

      if sample_ids.length != samples.length
        raise BulkDownloadsHelper::UPLOADER_ONLY_DOWNLOAD_TYPE
      end
    end

    get_valid_pipeline_run_ids_for_samples(viewable_samples)
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
      nil, # categories
      HeatmapHelper::READ_SPECIFICITY,
      HeatmapHelper::INCLUDE_PHAGE,
      HeatmapHelper::DEFAULT_NUM_RESULTS,
      0 # minimum read threshold
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
end
