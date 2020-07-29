class SfnCGPipelineDispatchService
  # This service is responsible for dispatching a request to the
  # Consensus Genomes Step Functions-based pipeline.
  # It generates the Step Function's input JSON and starts SFN execution

  include Callable

  class SfnArnMissingError < StandardError
    def initialize
      super("SFN_CG_ARN not set on App Config")
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

  def retrieve_docker_image_id
    resp = AwsClient[:sts].get_caller_identity
    # TODO(JIRA:IDSEQ-3164): do not use hardcoded docker image
    return "#{resp[:account]}.dkr.ecr.us-west-2.amazonaws.com/idseq-consensus-genome:sha-f47fb6c2f7ffc961"
  end

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

  def primer_file
    case @sample.temp_wetlab_protocol
    when Sample::TEMP_WETLAB_PROTOCOL[:msspe]
      "msspe_primers.bed"
    when Sample::TEMP_WETLAB_PROTOCOL[:artic]
      "artic_v3_primers.bed"
    else
      "msspe_primers.bed"
    end
  end

  def generate_wdl_input
    sfn_pipeline_input_json = {
      # TODO(JIRA:IDSEQ-3163): do not use hardcoded version (outputs will still be here in the SFN version returned by the tag)
      RUN_WDL_URI: "s3://#{S3_WORKFLOWS_BUCKET}/v1-consensus-genome/consensus-genome/run.wdl",
      Input: {
        Run: {
          docker_image_id: retrieve_docker_image_id,
          fastqs_0: File.join(@sample.sample_input_s3_path, @sample.input_files[0].name),
          fastqs_1: @sample.input_files[1] ? File.join(@sample.sample_input_s3_path, @sample.input_files[1].name) : nil,
          sample: @sample.name,
          ref_fasta: "s3://#{S3_DATABASE_BUCKET}/consensus-genome/MN908947.3.fa",
          ref_host: "s3://#{S3_DATABASE_BUCKET}/consensus-genome/hg38.fa.gz",
          kraken2_db_tar_gz: "s3://#{S3_DATABASE_BUCKET}/consensus-genome/kraken_coronavirus_db_only.tar.gz",
          primer_bed: "s3://#{S3_DATABASE_BUCKET}/consensus-genome/#{primer_file}",
          ercc_fasta: "s3://#{S3_DATABASE_BUCKET}/consensus-genome/ercc_sequences.fasta",
        },
      },
      OutputPrefix: @sample.sample_output_s3_path,
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
