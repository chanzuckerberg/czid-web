class BulkDownloadsValidationService
  SAMPLE_ACCESS_ERROR = "Error validating samples. Please contact us for help.".freeze
  UNKNOWN_DOWNLOAD_TYPE = "Could not find download type for bulk download".freeze
  UPLOADER_ONLY_DOWNLOAD_TYPE = "You must be the uploader of all selected samples to initiate this download type.".freeze
  MAX_SAMPLES_EXCEEDED_ERROR_TEMPLATE = "No more than %s samples allowed in one download.".freeze

  def initialize(query_ids, current_user, max_samples_allowed)
    @query_ids = query_ids
    @user = current_user
    @max_samples = max_samples_allowed
  end

  def validate_sample_ids
    error = nil

    begin
      viewable_samples = validate_sample_access(@query_ids, @user)
      finalized_info = get_finalized_sample_ids(viewable_samples)
    rescue => e
      Rails.logger.warn("Error validating samples for bulk download while checking against max samples: #{e}")
      error = e
    end

    result = if error.nil?
               {
                 valid_sample_ids: finalized_info[:valid_sample_ids],
                 invalid_sample_names: finalized_info[:invalid_sample_names],
                 error: error,
               }
             else
               { valid_sample_ids: [], invalid_sample_names: [], error: error }
             end

    return result
  end

  def download_type_valid?(type_data)
    if type_data.nil?
      raise UNKNOWN_DOWNLOAD_TYPE
    end

    if type_data[:admin_only] && !user.admin?
      raise SAMPLE_ACCESS_ERROR
    end

    if type_data[:uploader_only] && !user.admin?
      samples = Sample.where(user: user, id: sample_ids)

      if sample_ids.length != samples.length
        raise UPLOADER_ONLY_DOWNLOAD_TYPE
      end
    end

    return true
  end

  # Check that all pipeline runs have succeeded for the provided samples
  # and return the pipeline run ids.
  # Raise an error if any pipeline runs have not succeeded.
  def get_valid_pipeline_run_ids(samples)
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

  private ### *** PRIVATE METHODS *** ###

  # Will raise errors if any validation fails.
  # Returns pipeline_run_ids for the samples in the bulk download.
  def validate_sample_access(sample_ids, user)
    # Max samples check.
    max_samples_allowed = @max_samples

    # Max samples should be string containing an integer, but just in case.
    if max_samples_allowed.nil?
      raise SAMPLE_ACCESS_ERROR
    end

    if sample_ids.length > Integer(max_samples_allowed) && !user.admin?
      raise MAX_SAMPLES_EXCEEDED_ERROR_TEMPLATE % max_samples_allowed
    end

    current_power = Power.new(user)

    # Filter out samples the user shouldn't be able to view
    viewable_samples = current_power.viewable_samples.where(id: sample_ids)
    if viewable_samples.length != sample_ids.length
      raise SAMPLE_ACCESS_ERROR # don't leak permission/existence information
    end

    return viewable_samples
  end

  def get_finalized_sample_ids(samples)
    # Gets the first pipeline runs for multiple samples in an efficient way.
    created_dates = PipelineRun.select("sample_id, MAX(created_at) as created_at").where(sample_id: samples.pluck(:id)).group(:sample_id)
    valid_pipeline_runs = PipelineRun
                          .select(:finalized, :job_status, :sample_id)
                          .where("(sample_id, created_at) IN (?)", created_dates)
                          .where(finalized: 1)

    valid_pipeline_runs = valid_pipeline_runs.select(&:succeeded?)
    valid_sample_ids = valid_pipeline_runs.map(&:sample_id)

    invalid_samples = samples.reject { |sample| valid_sample_ids.include?(sample.id) }
    invalid_sample_names = invalid_samples.map(&:name)

    finalized_info = { valid_sample_ids: valid_sample_ids, invalid_sample_names: invalid_sample_names }

    return finalized_info
  end

  # Return all pipeline runs that have succeeded for given samples
  # Only check the first pipeline run.
  # samples should be an ActiveRecord relation
  # If strict mode is turned on, error out even if one pipeline run did not succeed.
  # Note: Does NOT do access control checks.
  def get_succeeded_pipeline_runs_for_samples(samples, strict = true)
    # Gets the first pipeline runs for multiple samples in an efficient way.
    created_dates = PipelineRun.select("sample_id, MAX(created_at) as created_at").where(sample_id: samples.pluck(:id)).group(:sample_id)
    valid_pipeline_runs = PipelineRun
                          .select(:finalized, :id, :job_status)
                          .where("(sample_id, created_at) IN (?)", created_dates)
                          .where(finalized: 1)

    if strict && valid_pipeline_runs.length != samples.length
      raise PIPELINE_RUN_STILL_RUNNING_ERROR
    end

    valid_pipeline_runs = valid_pipeline_runs.select(&:succeeded?)
    if strict && valid_pipeline_runs.length != samples.length
      raise PIPELINE_RUN_FAILED_ERROR
    end

    return valid_pipeline_runs
  end
end
