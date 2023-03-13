class SfnLongReadMngsPipelineDispatchService
  # This service is responsible for dispatching a request to the
  # Long Read Metagenomics Step Functions-based pipeline.
  # It generates the Step Function's input JSON and starts SFN execution

  include Callable
  include ParameterSanitization

  WORKFLOW_NAME = WorkflowRun::WORKFLOW[:long_read_mngs]

  HUMAN_S3_MINIMAP2_INDEX_PATH = "s3://idseq-public-references/host_filter/human/2018-02-15-utc-1518652800-unixtime__2018-02-15-utc-1518652800-unixtime/hg38_phiX_rRNA_mito_ERCC.fasta".freeze
  ERCC_DIRECTORY_PATH = "s3://czid-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime".freeze

  class SfnArnMissingError < StandardError
    def initialize
      super("SFN_SINGLE_WDL_ARN is not set on App Config.")
    end
  end

  class SfnVersionMissingError < StandardError
    def initialize(pipeline_run)
      super("WDL version for '#{pipeline_run}' not set.")
    end
  end

  def initialize(pipeline_run)
    @pipeline_run = pipeline_run
    @sample = pipeline_run.sample

    @sfn_arn = AppConfigHelper.get_app_config(AppConfig::SFN_SINGLE_WDL_ARN)
    raise SfnArnMissingError if @sfn_arn.blank?

    @wdl_version = PipelineVersionControlService.call(@sample.project.id, WORKFLOW_NAME, nil)
    raise SfnVersionMissingError, WORKFLOW_NAME if @wdl_version.blank?
  end

  def call
    @pipeline_run.update(
      executed_at: Time.now.utc,
      pipeline_version: @wdl_version[/\d+\.\d+/],
      s3_output_prefix: output_prefix,
      wdl_version: @wdl_version
    )
    sfn_input_json = generate_wdl_input
    sfn_execution_arn = dispatch(sfn_input_json)
    return {
      pipeline_version: @pipeline_run.pipeline_version,
      sfn_input_json: sfn_input_json,
      sfn_execution_arn: sfn_execution_arn,
    }
  end

  private

  def output_prefix
    "s3://#{ENV['SAMPLES_BUCKET_NAME']}/#{@sample.sample_path}/#{@pipeline_run.id}"
  end

  def retrieve_docker_image_id
    resp = AwsClient[:sts].get_caller_identity
    return "#{resp[:account]}.dkr.ecr.#{AwsUtil::AWS_REGION}.amazonaws.com/#{WORKFLOW_NAME}:v#{@wdl_version}"
  end

  def host_genome(library_type)
    if library_type.casecmp("dna").zero?
      @sample.host_genome.s3_minimap2_dna_index_path || "#{ERCC_DIRECTORY_PATH}/ercc_minimap2_genome_dna.mmi"
    else
      @sample.host_genome.s3_minimap2_rna_index_path || "#{ERCC_DIRECTORY_PATH}/ercc_minimap2_genome_rna.mmi"
    end
  end

  def generate_wdl_input
    library_type = @sample.metadata.find_by(key: "nucleotide_type")&.string_validated_value || ""
    {
      RUN_WDL_URI: "s3://#{S3_WORKFLOWS_BUCKET}/#{@pipeline_run.workflow_version_tag}/run.wdl",
      Input: {
        Run: {
          input_fastq: File.join(@sample.sample_input_s3_path, @sample.input_files[0].name),
          library_type: library_type,
          guppy_basecaller_setting: @pipeline_run.guppy_basecaller_setting,
          minimap_host_db: host_genome(library_type),
          minimap_human_db: HUMAN_S3_MINIMAP2_INDEX_PATH,
          subsample_depth: @sample.subsample, # optional input specified in Admin Options
          lineage_db: @pipeline_run.alignment_config.s3_lineage_path,
          accession2taxid_db: @pipeline_run.alignment_config.s3_accession2taxid_path,
          taxon_blacklist: @pipeline_run.alignment_config.s3_taxon_blacklist_path,
          deuterostome_db: @pipeline_run.alignment_config.s3_deuterostome_db_path,
          docker_image_id: retrieve_docker_image_id,
          minimap2_db: @pipeline_run.alignment_config.minimap2_long_db_path,
          diamond_db: @pipeline_run.alignment_config.diamond_db_path,
          s3_wd_uri: "#{output_prefix}/#{@pipeline_run.version_key_subpath}",
          nt_info_db: @pipeline_run.alignment_config.s3_nt_info_db_path || PipelineRunStage::DEFAULT_S3_NT_INFO_DB_PATH,
        },
      },
      OutputPrefix: output_prefix,
    }
  end

  def dispatch(sfn_input_json)
    sfn_name = "idseq-#{Rails.env}-#{@sample.project_id}-#{@sample.id}-#{@pipeline_run.id}-#{Time.zone.now.strftime('%Y%m%d%H%M%S')}"
    sfn_input = JSON.dump(sfn_input_json)
    resp = AwsClient[:states].start_execution(state_machine_arn: @sfn_arn,
                                              name: sfn_name,
                                              input: sfn_input)
    return resp[:execution_arn]
  end
end
