class SfnCGPipelineDispatchService
  # This service is responsible for dispatching a request to the
  # Consensus Genomes Step Functions-based pipeline.
  # It generates the Step Function's input JSON and starts SFN execution

  include Callable

  class SfnArnMissingError < StandardError
    def initialize
      super("SFN CG ARN not set on App Config")
    end
  end

  class SfnVersionTagsMissingError < StandardError
    def initialize(arn, tags)
      super("WDL version not set for SFN '#{arn}'. Tags missing: #{tags}")
    end
  end

  def initialize(sample)
    @sample = sample
    @sfn_arn = AppConfigHelper.get_app_config(AppConfig::SFN_CG_ARN)
    raise SfnArnMissingError if @sfn_arn.blank?
  end

  def call
    @sfn_tags = retrieve_version_tags
    sfn_input_json = generate_wdl_input
    sfn_execution_arn = dispatch(sfn_input_json)

    if sfn_execution_arn.blank?
      @sample.update(temp_sfn_execution_status: Sample::SFN_STATUS[:failed])
    else
      @sample.update(
        temp_sfn_execution_arn: sfn_execution_arn,
        temp_sfn_execution_status: Sample::SFN_STATUS[:running],
        temp_wdl_version: @sfn_tags[:wdl_version]
      )
      Rails.logger.info("CG Sample: id=#{@sample.id} sfn_execution_arn=#{sfn_execution_arn}")
    end

    return {
      sfn_input_json: sfn_input_json,
      sfn_execution_arn: sfn_execution_arn,
    }
  rescue => err
    # Set to failed and re-raise
    @sample.update(temp_sfn_execution_status: Sample::SFN_STATUS[:failed])
    LogUtil.log_err_and_airbrake("Error starting CG SFN pipeline for Sample #{@sample.id}: #{err}")
    LogUtil.log_backtrace(err)
    raise
  end

  private

  def retrieve_version_tags
    cache_key = "#{self.class.name}::#{@sfn_arn}::tags"
    Rails.cache.fetch(cache_key, expires_in: 1.minute) do
      resp = AwsClient[:states].list_tags_for_resource(resource_arn: @sfn_arn)
      tags = resp.tags.reduce({}) do |h, tag|
        h.update(tag.key => tag.value)
      end.symbolize_keys

      missing_tags = [:wdl_version].select { |tag_name| tags[tag_name].blank? }
      raise SfnVersionTagsMissingError.new(@sfn_arn, missing_tags) if missing_tags.present?
      tags
    end
  end

  def generate_wdl_input
    sfn_pipeline_input_json = {
      Input: {
        ConsensusGenome: {
          # TODO: Add real input when WDL workflow is ready.
          fastqs_0: File.join(@sample.sample_input_s3_path, @sample.input_files[0].name),
          fastqs_1: @sample.input_files[1] ? File.join(@sample.sample_input_s3_path, @sample.input_files[1].name) : nil,
        },
      },
    }
    return sfn_pipeline_input_json
  end

  def dispatch(sfn_input_json)
    sfn_name = "idseq-#{Rails.env}-#{@sample.project_id}-#{@sample.id}-cg-#{Time.zone.now.strftime('%Y%m%d%H%M%S')}"
    sfn_input = JSON.dump(sfn_input_json)

    resp = AwsClient[:states].start_execution(state_machine_arn: @sfn_arn,
                                              name: sfn_name,
                                              input: sfn_input)
    return resp[:execution_arn]
  end
end
