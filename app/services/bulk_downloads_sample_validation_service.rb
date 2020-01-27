class BulkDownloadsSampleValidationService
  SAMPLE_ACCESS_ERROR = "Error validating samples. Please contact us for help.".freeze

  def initialize(query_ids, current_user)
    @query_ids = query_ids.map(&:to_i)
    @user = current_user
  end

  def validate_samples
    error = nil
    result = { viewable_samples: [], error: error }

    begin
      viewable_samples = validate_sample_access(@query_ids, @user)
    rescue => e
      # just in case
      LogUtil.log_backtrace(e)
      LogUtil.log_err_and_airbrake("BulkDownloadsFailedEvent: Unexpected issue validating bulk download: #{e}")
      error = SAMPLE_ACCESS_ERROR
    end

    if error.nil?
      result[:viewable_samples] = viewable_samples
    else
      result[:error] = error
    end

    return result
  end

  private ### *** PRIVATE METHODS *** ###

  # Returns only the samples viewable by the current user.
  # Raises an error if more than the max samples allowed are passed.
  def validate_sample_access(sample_ids, user)
    current_power = Power.new(user)

    # Filter out samples the user shouldn't be able to view and log it
    viewable_samples = current_power.viewable_samples.where(id: sample_ids)
    if viewable_samples.length != sample_ids.length
      viewable_ids = viewable_samples.map(&:id)
      private_sample_ids = sample_ids.reject { |id| viewable_ids.include?(id) }
      LogUtil.log_err_and_airbrake("BulkDownloadsImproperAccessEvent: User with id #{user.id} made bulk download request for samples they don't have access to: #{private_sample_ids}")
    end

    return viewable_samples
  end
end
