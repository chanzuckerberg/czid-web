class SfnLongReadMngsPipelineDispatchService
  # This service is responsible for dispatching a request to the
  # Long Read Metagenomics Step Functions-based pipeline.
  # It generates the Step Function's input JSON and starts SFN execution

  include Callable
  include ParameterSanitization

  # TODO(ihan): define WorkflowRun::WORKFLOW[:long_read_mngs] in workflow.ts
  WORKFLOW_NAME = "long-read-mngs".freeze

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

    @wdl_version = AppConfigHelper.get_workflow_version(WORKFLOW_NAME)
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

  def generate_wdl_input
    {
      RUN_WDL_URI: "s3://#{S3_WORKFLOWS_BUCKET}/#{@pipeline_run.workflow_version_tag}/run.wdl",
      Input: {
        Run: {
          input_fastq: File.join(@sample.sample_input_s3_path, @sample.input_files[0].name),
          library_type: @sample.metadata.find_by(key: "nucleotide_type")&.string_validated_value || "",
          guppy_basecaller_setting: "hac|fast|super",
          # TODO(Todd): Add a new s3_minimap2_index_path column to host genomes
          # minimap_host_db: @sample.host_genome.s3_minimap2_index_path,
          # minimap_human_db: HostGenome.find_by(name: "Human").s3_minimap2_index_path,
          # TODO: The human_bowtie2_genome is hardcoded as the current human genome for testing purposes.
          # It should eventually be replaced with HostGenome.find_by(name: "Human").s3_bowtie2_index_path
          human_bowtie2_genome: "s3://idseq-public-references/host_filter/human/2018-02-15-utc-1518652800-unixtime__2018-02-15-utc-1518652800-unixtime/hg38_phiX_rRNA_mito_ERCC.fasta",
          max_input_fragments: @pipeline_run.max_input_fragments, # optional input
          subsample_depth: @pipeline_run.subsample, # optional input
          lineage_db: @pipeline_run.alignment_config.s3_lineage_path,
          accession2taxid_db: @pipeline_run.alignment_config.s3_accession2taxid_path,
          taxon_ignore_list: @pipeline_run.alignment_config.s3_taxon_blacklist_path,
          nt_db: @pipeline_run.alignment_config.s3_nt_db_path,
          nt_loc_db: @pipeline_run.alignment_config.s3_nt_loc_db_path,
          nr_db: @pipeline_run.alignment_config.s3_nr_db_path,
          nr_loc_db: @pipeline_run.alignment_config.s3_nr_loc_db_path,
          use_deuterostome_filter: @sample.skip_deutero_filter_flag != 1,
          deuterostome_db: @pipeline_run.alignment_config.s3_deuterostome_db_path,
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
