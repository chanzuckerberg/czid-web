class SfnPipelineDispatchService
  # This service is responsible for dispatching a request to the
  # StepFunctions-based pipeline.
  # It generates jsons for all the pipeline run stages, converts them to WDL,
  # creates the Step Function's input JSON and start SFN execution

  include Callable

  # Constains SFN deployment stage names that differ from Rails.env
  ENV_TO_DEPLOYMENT_STAGE_NAMES = {
    "development" => "dev",
    "staging" => "staging",
    "prod" => "prod",
  }.freeze

  WORKFLOW_NAME = WorkflowRun::WORKFLOW[:short_read_mngs]

  class SfnArnMissingError < StandardError
    def initialize
      super("SFN ARN not set on App Config")
    end
  end

  class SfnVersionMissingError < StandardError
    def initialize(workflow)
      super("WDL version for '#{workflow}' not set.")
    end
  end

  def initialize(pipeline_run)
    @pipeline_run = pipeline_run
    @sample = pipeline_run.sample

    @sfn_arn = AppConfigHelper.get_app_config(AppConfig::SFN_ARN)
    raise SfnArnMissingError if @sfn_arn.blank?

    @wdl_version = AppConfigHelper.get_workflow_version(WORKFLOW_NAME)
    raise SfnVersionMissingError, WORKFLOW_NAME if @wdl_version.blank?
  end

  def call
    @pipeline_run.update(
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
    sfn_pipeline_input_json = {
      dag_branch: @pipeline_run.pipeline_branch != "master" ? @pipeline_run.pipeline_branch : nil,
      HOST_FILTER_WDL_URI: "s3://#{S3_WORKFLOWS_BUCKET}/#{@pipeline_run.workflow_version_tag}/host_filter.wdl",
      NON_HOST_ALIGNMENT_WDL_URI: "s3://#{S3_WORKFLOWS_BUCKET}/#{@pipeline_run.workflow_version_tag}/non_host_alignment.wdl",
      POSTPROCESS_WDL_URI: "s3://#{S3_WORKFLOWS_BUCKET}/#{@pipeline_run.workflow_version_tag}/postprocess.wdl",
      EXPERIMENTAL_WDL_URI: "s3://#{S3_WORKFLOWS_BUCKET}/#{@pipeline_run.workflow_version_tag}/experimental.wdl",
      Input: {
        HostFilter: {
          fastqs_0: File.join(@sample.sample_input_s3_path, @sample.input_files[0].name),
          fastqs_1: @sample.input_files[1] ? File.join(@sample.sample_input_s3_path, @sample.input_files[1].name) : nil,
          file_ext: @sample.fasta_input? ? "fasta" : "fastq",
          nucleotide_type: @sample.metadata.find_by(key: "nucleotide_type")&.string_validated_value || "",
          host_genome: @sample.host_genome_name.downcase,
          adapter_fasta: PipelineRun::ADAPTER_SEQUENCES[@sample.input_files[1] ? "paired-end" : "single-end"],
          star_genome: @sample.host_genome.s3_star_index_path,
          bowtie2_genome: @sample.host_genome.s3_bowtie2_index_path,
          human_star_genome: HostGenome.find_by(name: "Human").s3_star_index_path,
          human_bowtie2_genome: HostGenome.find_by(name: "Human").s3_bowtie2_index_path,
          max_input_fragments: @pipeline_run.max_input_fragments,
          max_subsample_fragments: @pipeline_run.subsample,
        }, NonHostAlignment: {
          lineage_db: @pipeline_run.alignment_config.s3_lineage_path,
          accession2taxid_db: @pipeline_run.alignment_config.s3_accession2taxid_path,
          taxon_blacklist: @pipeline_run.alignment_config.s3_taxon_blacklist_path,
          index_dir_suffix: @pipeline_run.alignment_config.index_dir_suffix,
          use_deuterostome_filter: @sample.skip_deutero_filter_flag != 1,
          deuterostome_db: @pipeline_run.alignment_config.s3_deuterostome_db_path,
        }, Postprocess: {
          nt_db: @pipeline_run.alignment_config.s3_nt_db_path,
          nt_loc_db: @pipeline_run.alignment_config.s3_nt_loc_db_path,
          nr_db: @pipeline_run.alignment_config.s3_nr_db_path,
          nr_loc_db: @pipeline_run.alignment_config.s3_nr_loc_db_path,
          lineage_db: @pipeline_run.alignment_config.s3_lineage_path,
          taxon_blacklist: @pipeline_run.alignment_config.s3_taxon_blacklist_path,
          use_deuterostome_filter: @sample.skip_deutero_filter_flag != 1,
          deuterostome_db: @pipeline_run.alignment_config.s3_deuterostome_db_path,
        }, Experimental: {
          nt_db: @pipeline_run.alignment_config.s3_nt_db_path,
          nt_loc_db: @pipeline_run.alignment_config.s3_nt_loc_db_path,
          file_ext: @sample.fasta_input? ? "fasta" : "fastq",
          nt_info_db: @pipeline_run.alignment_config.s3_nt_info_db_path || PipelineRunStage::DEFAULT_S3_NT_INFO_DB_PATH,
        },
      },
      OutputPrefix: output_prefix,
    }
    return sfn_pipeline_input_json
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
