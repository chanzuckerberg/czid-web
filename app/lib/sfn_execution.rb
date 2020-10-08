class SfnExecution
  attr_reader :description, :history

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

  def initialize(execution_arn, s3_path)
    @execution_arn = execution_arn
    @s3_path = s3_path
  end

  def description
    @memoized_description ||= description_from_aws
  end

  def history
    @memoized_history ||= history_from_aws
  end

  def error
    if description && description[:status] == "FAILED"
      return history[:events].last["execution_failed_event_details"]["error"]
    end
  end

  def output_path(output_key)
    map = workflow_result_mapping
    path = map[output_key]
    raise OutputNotFoundError.new(output_key, map.keys) unless path

    return path
  end

  private

  def description_from_aws
    return if @execution_arn.blank?

    AwsClient[:states].describe_execution(execution_arn: @execution_arn)
  rescue Aws::States::Errors::ExecutionDoesNotExist, ArgumentError
    return if @s3_path.blank?

    # Attention: Timestamp fields will be returned as strings
    description_json = S3Util.get_s3_file("#{@s3_path}/sfn-desc/#{@execution_arn}")
    description_json && JSON.parse(description_json, symbolize_names: true)
  end

  # SFN history for workflow runs
  def history_from_aws
    return if @execution_arn.blank?

    AwsClient[:states].get_execution_history(execution_arn: @execution_arn)
  rescue Aws::States::Errors::ExecutionDoesNotExist, ArgumentError
    return if @s3_path.blank?

    # Attention: Timestamp fields will be returned as strings
    history_json = S3Util.get_s3_file("#{@s3_path}/sfn-hist/#{@execution_arn}")
    history_json && JSON.parse(history_json, symbolize_names: true)
  end

  def workflow_result_mapping
    raise SfnDescriptionNotFoundError, @s3_path unless description && description[:output]

    output_result = JSON.parse(description[:output])
    return output_result["Result"]
  end
end
