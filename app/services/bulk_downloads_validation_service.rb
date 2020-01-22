class BulkDownloadsValidationService
  SAMPLE_ACCESS_ERROR = "Error validating samples. Please contact us for help.".freeze
  UNKNOWN_DOWNLOAD_TYPE = "Could not find download type for bulk download".freeze
  UPLOADER_ONLY_DOWNLOAD_TYPE = "You must be the uploader of all selected samples to initiate this download type.".freeze
  MAX_SAMPLES_EXCEEDED_ERROR_TEMPLATE = "No more than %s samples allowed in one download.".freeze

  def initialize(query_ids, current_user, max_samples_allowed)
    @query_ids = query_ids.map(&:to_i)
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

  private ### *** PRIVATE METHODS *** ###

  # Returns only the samples viewable by the current user.
  # Raises an error if more than the max samples allowed are passed.
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

    # Filter out samples the user shouldn't be able to view and log it
    viewable_samples = current_power.viewable_samples.where(id: sample_ids)
    if viewable_samples.length != sample_ids.length
      viewable_ids = viewable_samples.map(&:id)
      private_samples = sample_ids.reject { |id| viewable_ids.include?(id) }
      LogUtil.log_err_and_airbrake("BulkDownloadsImproperAccessEvent: User made bulk download request for samples they don't have access to: #{private_samples}")
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
end
