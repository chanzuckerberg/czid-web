module BulkDownloadsHelper
  include PipelineRunsHelper
  include SamplesHelper

  SAMPLE_NO_PERMISSION_ERROR = "You do not have permission to access all of the selected samples. Please contact us for help.".freeze
  WORKFLOW_RUN_NO_PERMISSION_ERROR = "You do not have permission to access all of the selected workflow runs. Please contact us for help.".freeze
  SAMPLE_STILL_RUNNING_ERROR = "Some selected samples have not finished running yet. Please remove these samples and try again.".freeze
  SAMPLE_FAILED_ERROR = "Some selected samples failed their most recent run. Please remove these samples and try again.".freeze
  MAX_OBJECTS_EXCEEDED_ERROR_TEMPLATE = "No more than %s objects allowed in one download.".freeze
  INVALID_OPERATOR_ERROR = "The given operator was not recognized".freeze
  BULK_DOWNLOAD_NOT_FOUND = "No bulk download was found with this id.".freeze
  OUTPUT_FILE_NOT_SUCCESSFUL = "Bulk download has not succeeded. Can't get output file url.".freeze
  INVALID_ACCESS_TOKEN = "The access token was invalid for this bulk download.".freeze
  KICKOFF_FAILURE = "Unexpected error kicking off bulk download.".freeze
  KICKOFF_FAILURE_HUMAN_READABLE = "Could not kick off bulk download. Please contact us for help.".freeze
  APP_CONFIG_MAX_OBJECTS_NOT_SET = "Could not kick off bulk download. Please contact us for help.".freeze
  PRESIGNED_URL_GENERATION_ERROR = "Could not generate a presigned url.".freeze
  SUCCESS_URL_REQUIRED = "Success url required for bulk download.".freeze
  FAILED_SAMPLES_ERROR_TEMPLATE = "%s samples could not be processed. Please contact us for help.".freeze
  COMBINED_SAMPLE_TAXON_RESULTS_ERROR_TEMPLATE = "%s samples were missing or had no data for the selected metric. Please contact us for help.".freeze
  UNKNOWN_EXECUTION_TYPE = "Could not find execution type for bulk download".freeze
  UNKNOWN_DOWNLOAD_TYPE = "Could not find download type for bulk download".freeze
  ADMIN_ONLY_DOWNLOAD_TYPE = "You must be an admin to initiate this download type.".freeze
  UPLOADER_ONLY_DOWNLOAD_TYPE = "You must be the uploader of all selected samples to initiate this download type.".freeze
  COLLABORATOR_ONLY_DOWNLOAD_TYPE = "You must be a collaborator on the respective projects of each sample to initiate this download type.".freeze
  BULK_DOWNLOAD_GENERATION_FAILED = "Could not generate bulk download".freeze
  READS_NON_HOST_TAXON_LINEAGE_EXPECTED_TEMPLATE = "Unexpected error. Could not find valid taxon lineage for taxid %s".freeze
  MISSING_SAMPLE_IDS_ERROR = "Sample IDs must be provided as an array".freeze
  TAXONOMY_LIST = ["superkingdom_name", "kingdom_name", "phylum_name", "class_name", "order_name", "family_name", "genus_name", "species_name"].freeze
  METRIC_MAP = {
    "r": "count",
    "zscore": "z_score",
    "rpm": "rpm",
    "percentidentity": "percent_identity",
    "alignmentlength": "alignment_length",
    "logevalue": "e_value",
  }.freeze

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
    analyses_counts = {}.tap do |counts_hash|
      counts_hash[WorkflowRun::WORKFLOW[:amr]] = bulk_download.workflow_runs.where(workflow: WorkflowRun::WORKFLOW[:amr]).count
      counts_hash[WorkflowRun::WORKFLOW[:consensus_genome]] = bulk_download.workflow_runs.where(workflow: WorkflowRun::WORKFLOW[:consensus_genome]).count
      counts_hash[WorkflowRun::WORKFLOW[:short_read_mngs]] = bulk_download.pipeline_runs.length
    end

    # TODO: We need to adapt this when we can create bulk downloads from multiple workflows.
    # This approach works because we can create a bulk download from one and only one workflow.
    workflow, count = if analyses_counts[WorkflowRun::WORKFLOW[:short_read_mngs]] > 0
                        [WorkflowRun::WORKFLOW[:short_read_mngs], analyses_counts[WorkflowRun::WORKFLOW[:short_read_mngs]]]
                      elsif analyses_counts[WorkflowRun::WORKFLOW[:consensus_genome]] > 0
                        [WorkflowRun::WORKFLOW[:consensus_genome], analyses_counts[WorkflowRun::WORKFLOW[:consensus_genome]]]
                      elsif analyses_counts[WorkflowRun::WORKFLOW[:amr]] > 0
                        [WorkflowRun::WORKFLOW[:amr], analyses_counts[WorkflowRun::WORKFLOW[:amr]]]
                      else
                        # The bulk download has no pipeline runs or workflow runs associated with it
                        # We should never get to this else statement, unless there is an issue with
                        # bulk download not being deleted when its corresponding samples get deleted.
                        LogUtil.log_message("BulkDownloadsHelper#format_bulk_download - bulk download #{bulk_download.id} has no associated workflow runs or pipeline runs. We should delete it.")

                        # return mNGS and 0 intentionally so the client does not crash
                        [WorkflowRun::WORKFLOW[:short_read_mngs], 0]
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
      raise BulkDownloadsHelper::APP_CONFIG_MAX_OBJECTS_NOT_SET
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

    if type_data[:collaborator_only] && !validate_user_is_collaborator_or_admin(sample_ids, user)
      raise BulkDownloadsHelper::COLLABORATOR_ONLY_DOWNLOAD_TYPE
    end

    if type_data[:uploader_only] && !user.admin?
      my_objects = sample_ids.present? ? current_power.viewable_samples.where(user: user, id: sample_ids) : current_power.workflow_runs.created_by(user).where(id: workflow_run_ids)
      raise BulkDownloadsHelper::UPLOADER_ONLY_DOWNLOAD_TYPE if objects_count != my_objects.length
    end

    return viewable_objects
  end

  def validate_sample_metadata_params(params, user)
    current_power = Power.new(user)

    sample_ids = params[:sample_ids]
    raise BulkDownloadsHelper::MISSING_SAMPLE_IDS_ERROR unless sample_ids.is_a?(Array)

    sample_ids = sample_ids.uniq
    validate_num_objects(sample_ids.length, AppConfig::MAX_OBJECTS_BULK_DOWNLOAD)

    viewable_objects = current_power.viewable_samples.where(id: sample_ids)
    raise BulkDownloadsHelper::SAMPLE_NO_PERMISSION_ERROR if sample_ids.length != viewable_objects.count

    [sample_ids, viewable_objects]
  end

  # Generate the metric values matrix.
  def self.generate_metric_values(taxon_counts_by_pr, samples, metric)
    workflow = samples.first.initial_workflow
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
      taxid_to_taxon_counts = ReportHelper.taxon_counts_cleanup(results_taxon_counts, workflow)
      # Only consider species level counts.
      HeatmapHelper.only_species_level_counts!(taxid_to_taxon_counts)

      sample_metric_values = {}

      taxid_to_taxon_counts.each do |taxid, taxon_counts|
        metric_value = taxon_counts.dig(*metric_path)

        # Don't include 0 values for reads or rPM metrics.
        # Include ALL values for zscore metrics for now, because it's less clear what to omit,
        # since zscore can be nonzero even if the corresponding read count was zero.
        # Include 0 and negative values for logevalue because the database is actually storing the exponent value
        # which tends to have negative numbers as real values
        if metric_value > 0 || metric == "NT.zscore" || metric == "NR.zscore" || metric == "NT.logevalue" || metric == "NR.logevalue"
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

  def self.filter_zscore(zscore_filters, zscore)
    zscore_filters.map do |filter|
      if filter[:operator] == ">="
        zscore >= Float(filter[:value])
      elsif filter[:operator] == "<="
        zscore <= Float(filter[:value])
      else
        return raise INVALID_OPERATOR_ERROR
      end
    end.all?
  end

  def self.output_tsv_row(tsv, taxonomy_tsv, sample_metrics, prev_taxon_count)
    return if prev_taxon_count.nil?

    taxon_list = TAXONOMY_LIST.map { |taxonomy_level| prev_taxon_count[taxonomy_level] }
    taxon_uniq_id = taxon_list.join(";")

    tsv << sample_metrics.unshift(taxon_uniq_id) # output sample metrics
    taxonomy_tsv << taxon_list.drop(1).unshift(taxon_uniq_id)
  end

  def self.pivot_biom_metrics(
    taxon_metrics,
    zscore_filters,
    metric,
    sample_names,
    pr_id_to_sample_id,
    fields,
    bulk_download_id
  )
    # Pivots the taxon metrics table in chunks and streams the output to tsv
    # Also streams the taxonomy metadata to a tsv
    taxon_metric_ids = taxon_metrics.pluck(:id)
    sample_metrics = Array.new(sample_names.count, 0) # create empty array of sample names
    data_file = "/tmp/#{bulk_download_id}_output.tsv"
    taxonomy_file = "/tmp/#{bulk_download_id}_taxonomy.tsv"
    CSVSafe.open(data_file, "wb", col_sep: "\t") do |tsv|
      CSVSafe.open(taxonomy_file, "wb", col_sep: "\t") do |taxonomy_tsv|
        tsv << ["Taxon Name"] + sample_names
        taxonomy_tsv << [
          "#TaxID",
          "taxonomy1",
          "taxonomy2",
          "taxonomy3",
          "taxonomy4",
          "taxonomy5",
          "taxonomy6",
          "taxonomy7",
        ]
        prev_taxon_count = nil
        taxon_metric_ids.in_groups_of(10_000) do |ids|
          taxon_metrics.order(:tax_id, :pipeline_run_id).where(id: ids).pluck_to_hash(*fields).each do |taxon_count|
            pass_zscore_filter = filter_zscore(zscore_filters, taxon_count["z_score"])
            next unless pass_zscore_filter

            if prev_taxon_count.present? && taxon_count["tax_id"] != prev_taxon_count["tax_id"] # if taxon changes, output the previous row
              output_tsv_row(tsv, taxonomy_tsv, sample_metrics, prev_taxon_count)
              sample_metrics = Array.new(sample_names.count, 0) # recreate new sample metrics array
            end
            ind = pr_id_to_sample_id.keys.index(taxon_count["pipeline_run_id"]) # get index of run_id, likely will want to turn this into a map of some kind
            sample_metrics[ind] = taxon_count[metric].nil? ? 0 : taxon_count[metric] # set metric to array
            prev_taxon_count = taxon_count
          end
        end
        output_tsv_row(tsv, taxonomy_tsv, sample_metrics, prev_taxon_count) # must output the last row
      end
    end
    return [data_file, taxonomy_file]
  end

  def self.output_metadata(samples_index, sample_names, bulk_download_id)
    # Gets the metadata for each sample. We might want to add in additional metadata.
    metadata_headers, metadata_keys, metadata_by_sample_id = generate_sample_metadata_csv_info(samples: samples_index.values)
    metadata_path = "/tmp/#{bulk_download_id}_metadata.tsv"
    CSVSafe.open(metadata_path, "wb", col_sep: "\t") do |csv|
      csv << metadata_headers.unshift("#SampleID")
      sample_names.each do |sample_name|
        sample_id = sample_name.split(":")[1].to_i
        sample_metadata = metadata_by_sample_id[sample_id]
        csv << metadata_keys.map { |metadata_key| sample_metadata[metadata_key] }.unshift(sample_name)
      end
    end
    return metadata_path
  end

  def self.filter_by_category(categories, taxon_metrics)
    return taxon_metrics if categories.blank?

    superkingdom_taxids = categories.map { |category| ReportHelper::CATEGORIES_TAXID_BY_NAME[category] }
    taxon_metrics.where(superkingdom_taxid: superkingdom_taxids)
  end

  def self.parse_metric_string(metric_string)
    if metric_string.include?("_")
      count_type, metric_fe = metric_string.split("_", 2) # split into 2
    elsif metric_string.include?(".")
      count_type, metric_fe = metric_string.split(".", 2) # split into 2
    end
    [count_type, METRIC_MAP[metric_fe.to_sym]]
  end

  def self.parse_filters(filters)
    filters.map do |filter|
      count_type, metric = parse_metric_string(filter["metric"])
      {
        metric: metric,
        value: Float(filter["value"]),
        operator: filter["operator"],
        count_type: count_type,
      }
    end
  end

  def self.filter_by_threshold(filters, taxon_metrics)
    return [taxon_metrics, []] if filters.blank?

    filters = parse_filters(filters)
    # zscore filters have to be filtered out since they aren't calculated until the `pluck_to_hash`
    zscore_filters = filters.select { |filter| filter[:metric] == "z_score" }
    taxon_count_filters = filters.reject { |filter| filter[:metric] == "z_score" }
    filters_by_count_type = Sample.group_taxon_count_filters_by_count_type(taxon_count_filters)
    return [taxon_metrics, zscore_filters] if filters_by_count_type.count == 0

    taxon_return_metrics = nil
    filters_by_count_type.each do |count_type, query_statements|
      joined_query_statement = query_statements.join(" AND ")
      taxon_return_metrics = if taxon_return_metrics.nil?
                               taxon_metrics.where(count_type: count_type).where(joined_query_statement)
                             else
                               taxon_return_metrics.or(taxon_metrics.where(count_type: count_type).where(joined_query_statement))
                             end
    end
    [taxon_return_metrics, zscore_filters]
  end

  def self.filter_by_count_type(count_type, taxon_metrics)
    return taxon_metrics unless ["NT", "NR"].include?(count_type)

    taxon_metrics.where(count_type: count_type)
  end

  def self.generate_biom_format_file(pipeline_runs, metric_string, background_id, categories, filters, bulk_download_id)
    # Uses the TaxonCountsDataService to generate the files needed for the biom format
    pr_id_to_sample_id = pipeline_runs.non_deprecated.pluck(:id, :sample_id).to_h
    pipeline_run_ids = pr_id_to_sample_id.keys
    taxon_metrics, fields = TaxonCountsDataService.call(
      pipeline_run_ids: pipeline_run_ids,
      taxon_ids: nil,
      background_id: background_id,
      include_lineage: true,
      lazy: true
    )
    taxon_metrics = taxon_metrics.where(tax_level: TaxonCount::TAX_LEVEL_SPECIES)

    taxon_metrics = filter_by_category(categories, taxon_metrics)

    count_type, metric = parse_metric_string(metric_string)
    taxon_metrics = filter_by_count_type(count_type, taxon_metrics)

    taxon_metrics, zscore_filters = filter_by_threshold(filters, taxon_metrics)

    # create ordered list of sample names
    samples_index = Sample.find(pr_id_to_sample_id.values).index_by(&:id)
    sample_names = pr_id_to_sample_id.values.collect { |sample_id| samples_index[sample_id] }.pluck(:name, :id).map { |name, id| "#{name}:#{id}" }

    # output metadata
    metadata_path = output_metadata(samples_index, sample_names, bulk_download_id)

    # create pivot table so that we end up with array of shape taxons X pipeline runs, with metric as the value
    taxon_metrics = taxon_metrics.order(tax_id: :asc, pipeline_run_id: :asc)
    metrics_path, taxon_lineage_path = pivot_biom_metrics(
      taxon_metrics,
      zscore_filters,
      metric,
      sample_names,
      pr_id_to_sample_id,
      fields,
      bulk_download_id
    )

    [metrics_path, metadata_path, taxon_lineage_path]
  end

  # This method models HeatmapHelper.sample_taxons_dict when fetching metrics. It uses the necessary logic from that function.
  def self.generate_combined_sample_taxon_results_csv(samples, background_id, metric)
    # First, fetch all the data.

    # For each sample, fetch taxon counts for that sample.
    # By default, fetches top 1,000,000 taxons for each sample.
    taxon_counts_by_pr = TopTaxonsSqlService.call(
      samples,
      background_id,
      min_reads: 0, # minimum read threshold
      taxa_per_sample: 1_000_000
    )

    # Generate the metric values matrix.
    # Also generate a hash of all encountered taxids to their taxonomy name.
    metric_values, taxids_to_name = BulkDownloadsHelper.generate_metric_values(taxon_counts_by_pr, samples, metric)
                                                       .values_at(:metric_values, :taxids_to_name)

    # Filter out any samples which could not be fetched or had no valid data for the metric.
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

  def self.generate_metadata_arr(samples)
    metadata_headers, metadata_keys, metadata_by_sample_id = BulkDownloadsHelper.generate_sample_metadata_csv_info(samples: samples)
    csv = []
    csv << ["sample_name"] + metadata_headers
    samples.each do |sample|
      metadata = metadata_by_sample_id[sample.id] || {}
      csv << [sample.name] + metadata.values_at(*metadata_keys)
    end
    csv
  end

  def self.cg_overview_headers
    ["Sample Name", "Reference Accession", "Reference Accession ID", *ConsensusGenomeMetricsService::ALL_METRICS.values]
  end

  def self.generate_cg_overview_csv(workflow_runs:, include_metadata: false)
    csv_headers = BulkDownloadsHelper.cg_overview_headers

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

  # Returns an array of arrays containing CG overview data in rows
  def self.generate_cg_overview_data(workflow_runs:, include_metadata: false)
    overview_arr = []
    headers = BulkDownloadsHelper.cg_overview_headers

    if include_metadata
      cg_metadata_headers, metadata_keys, metadata_by_sample_id = BulkDownloadsHelper.cg_overview_metadata_headers_and_info(workflow_runs: workflow_runs)
      headers.concat(cg_metadata_headers)
    end

    overview_arr << headers
    workflow_runs.includes(:sample).each do |wr|
      cg_metric_row_values = BulkDownloadsHelper.prepare_workflow_run_metrics_csv_info(workflow_run: wr)
      wr_row_values = [wr.sample.name, wr.inputs&.[]("accession_name"), wr.inputs&.[]("accession_id")] + cg_metric_row_values

      if include_metadata
        metadata = metadata_by_sample_id[wr.sample.id] || {}
        sample_metadata_row_values = metadata.values_at(*metadata_keys)
        cg_metadata_row_values = [wr.inputs&.[]("wetlab_protocol") || '', wr.executed_at]
        wr_row_values.concat(cg_metadata_row_values, sample_metadata_row_values)
      end

      overview_arr << wr_row_values
    end

    overview_arr
  end

  def self.generate_cg_sample_metadata(sample_ids, _user)
    metadata_hash = {}
    samples = Sample.where(id: sample_ids)
    metadata_headers, metadata_keys, metadata_by_sample_id = BulkDownloadsHelper.generate_sample_metadata_csv_info(samples: samples)

    metadata_hash["headers"] = metadata_headers.map { |h| h.humanize.titleize }

    samples.each do |sample|
      metadata = metadata_by_sample_id[sample.id] || {}
      sample_metadata_row_values = metadata.values_at(*metadata_keys)
      metadata_hash[sample.id] = sample_metadata_row_values
    end

    metadata_hash
  end

  def self.cg_overview_metadata_headers_and_info(workflow_runs:)
    samples = Sample.where(id: workflow_runs.pluck(:sample_id).uniq)
    metadata_headers, metadata_keys, metadata_by_sample_id = BulkDownloadsHelper.generate_sample_metadata_csv_info(samples: samples)
    cg_metadata_headers = ["Wetlab Protocol", "Executed At"]
    cg_metadata_headers.concat(metadata_headers.map { |h| h.humanize.titleize })
    [cg_metadata_headers, metadata_keys, metadata_by_sample_id]
  end

  def self.prepare_workflow_run_metrics_csv_info(workflow_run:)
    parsed_cached_results = workflow_run.parsed_cached_results
    quality_metrics = parsed_cached_results&.[]("quality_metrics") if parsed_cached_results.present?
    coverage_viz_metrics = parsed_cached_results&.[]("coverage_viz") if parsed_cached_results.present?

    all_metrics = Hash.new('') # set default value to ""
    all_metrics.update(quality_metrics) if quality_metrics.present?
    all_metrics.update(coverage_viz_metrics) if coverage_viz_metrics.present?
    unless all_metrics.empty?
      return all_metrics.values_at(*ConsensusGenomeMetricsService::ALL_METRICS.keys.map(&:to_s))
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
