class SfnExecution
  class OutputNotFoundError < StandardError
    def initialize(output_key, available_keys)
      super("Output not available: #{output_key}. Available outputs: #{available_keys.join(', ')}")
    end
  end

  class SfnDescriptionNotFoundError < StandardError
    def initialize(path)
      super("SFN description not found. Path: #{path}")
    end
  end

  def initialize(execution_arn:, s3_path:, finalized: nil)
    @execution_arn = execution_arn
    @s3_path = s3_path
    @finalized = finalized
  end

  def description
    @memoized_description ||= description_from_aws
  end

  def history
    @memoized_history ||= history_from_aws
  end

  def error
    if description && description[:status] == "FAILED"
      return history[:events].last[:execution_failed_event_details][:error]
    end
  end

  def stop_execution(wait = false)
    return if @execution_arn.blank?

    AwsClient[:states].stop_execution(execution_arn: @execution_arn)

    wait_until_finalized if wait
  end

  def output_path(output_key)
    map = workflow_result_mapping
    path = map[output_key]
    raise OutputNotFoundError.new(output_key, map.keys) unless path

    return path
  end

  private

  def wait_until_finalized
    start = Time.now.to_i
    desc = sfn_archive_from_s3("sfn-desc")
    hist = sfn_archive_from_s3("sfn-hist")
    until (desc && desc[:status] == "ABORTED" && hist && hist[:events].last && hist[:events].last[:type] == "ExecutionAborted") || Time.now.to_i > 120 + start
      sleep(0.1)
      desc = sfn_archive_from_s3("sfn-desc")
      hist = sfn_archive_from_s3("sfn-hist")
    end
    @finalized = true
  end

  def description_from_aws
    return if @execution_arn.blank?

    # Prefer S3 if finalized b/c describe_execution has a low rate limit
    return sfn_archive_from_s3("sfn-desc") if @finalized

    AwsClient[:states].describe_execution(execution_arn: @execution_arn)
  rescue Aws::States::Errors::ExecutionDoesNotExist, ArgumentError
    sfn_archive_from_s3("sfn-desc")
  end

  # SFN history for workflow runs
  def history_from_aws
    return if @execution_arn.blank?

    # Prefer S3 if finalized b/c get_execution_history has a low rate limit
    return sfn_archive_from_s3("sfn-hist") if @finalized

    AwsClient[:states].get_execution_history(execution_arn: @execution_arn)
  rescue Aws::States::Errors::ExecutionDoesNotExist, ArgumentError
    sfn_archive_from_s3("sfn-hist")
  end

  def sfn_archive_from_s3(subpath)
    return if @s3_path.blank?

    # Attention: Timestamp fields will be returned as strings
    archive_json = S3Util.get_s3_file("#{@s3_path}/#{subpath}/#{@execution_arn}")
    archive_json && format_json(archive_json)
  end

  def format_json(json)
    # Underscore key transform for uniformity.
    # Ex: JSON export may have saved 'executionFailedEventDetails' instead of 'execution_failed_event_details'. The AWS SDK structs return underscore keys.
    JSON.parse(json).deep_transform_keys { |key| key.to_s.underscore.to_sym }
  end

  def workflow_result_mapping
    raise SfnDescriptionNotFoundError, @s3_path unless description && description[:output]

    output_result = JSON.parse(description[:output])
    return output_result["Result"]
  end
end
