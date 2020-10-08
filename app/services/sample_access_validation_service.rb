# SampleAccessValidationService takes an array of sample ids and a user filters out samples that the
# user does not have access to and samples that are either in processing or failed the last pipeline
# run. It returns a hash with two keys: viewable_samples, which is an array of Samples (not ids!)
# that passed the filter; and error, which, if present, will always be the SAMPLE_ACCESS_ERROR string.
class SampleAccessValidationService
  include Callable

  SAMPLE_ACCESS_ERROR = "Error validating samples. Please contact us for help.".freeze

  def initialize(query_ids, current_user)
    if query_ids.nil?
      Rails.logger.warn("SampleAccessValidationService called with query_ids = nil")
      @query_ids = []
    else
      @query_ids = query_ids.map(&:to_i)
    end
    @user = current_user
  end

  def call
    error = nil
    result = { viewable_samples: [], error: error }

    begin
      viewable_samples = validate_sample_access(@query_ids, @user)
    rescue StandardError => e
      # just in case
      LogUtil.log_backtrace(e)
      LogUtil.log_err("SampleAccessValidationFailedEvent: Unexpected issue validating sample access: #{e}")
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
      Rails.logger.warn("SampleAccessValidationImproperAccessEvent: User with id #{user.id} made a request for samples they don't have access to: #{private_sample_ids}")
    end

    return viewable_samples
  end
end
