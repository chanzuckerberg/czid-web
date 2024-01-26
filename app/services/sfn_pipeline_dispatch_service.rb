class SfnPipelineDispatchService
  # This service is responsible for dispatching a request to the
  # StepFunctions-based pipeline.
  # It generates jsons for all the pipeline run stages, converts them to WDL,
  # creates the Step Function's input JSON and start SFN execution
  include PipelineRunsHelper
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
      super("SFN_MNGS_ARN and SFN_ARN not set on App Config")
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
    @sfn_arn = AppConfigHelper.get_app_config(AppConfig::SFN_MNGS_ARN) || AppConfigHelper.get_app_config(AppConfig::SFN_ARN)
    raise SfnArnMissingError if @sfn_arn.blank?

    @wdl_version = /\d+\.\d+\.\d+/ =~ pipeline_run.pipeline_branch ? pipeline_run.pipeline_branch : VersionRetrievalService.call(@sample.project.id, WORKFLOW_NAME)

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

  # CZID-8173: We occasionally update the version of our human host genome.
  # However, we want to avoid disrupting old projects, so when a project is created
  # we pin the human version to keep human genome consistent throughout a project.
  def appropriate_human_genome
    human_host_version = VersionRetrievalService.call(@sample.project.id, HostGenome::HUMAN_HOST)
    HostGenome.find_by(name: "Human", version: human_host_version)
  end

  def new_host_filtering_inputs(host_genome, human_host_genome)
    {
      fastqs_0: File.join(@sample.sample_input_s3_path, @sample.input_files.fastq[0].name),
      fastqs_1: @sample.input_files.fastq[1] ? File.join(@sample.sample_input_s3_path, @sample.input_files.fastq[1].name) : nil,
      nucleotide_type: @sample.metadata.find_by(key: "nucleotide_type")&.string_validated_value || "",

      adapter_fasta: PipelineRun::ADAPTER_SEQUENCES[@sample.input_files.fastq[1] ? "paired-end" : "single-end"],

      host_genome: host_genome.name.downcase,
      bowtie2_index_tar: host_genome.s3_bowtie2_index_path_v2,
      hisat2_index_tar: host_genome.s3_hisat2_index_path,
      kallisto_idx: host_genome.s3_kallisto_index_path,
      human_bowtie2_index_tar: human_host_genome.s3_bowtie2_index_path_v2,
      human_hisat2_index_tar: human_host_genome.s3_hisat2_index_path,
      gtf_gz: host_genome.name == "Human" ? host_genome.s3_original_transcripts_gtf_index_path : nil,

      max_input_fragments: @pipeline_run.max_input_fragments,
      max_subsample_fragments: @pipeline_run.subsample,
      file_ext: @sample.fasta_input? ? "fasta" : "fastq",
    }
  end

  def generate_wdl_input
    host_genome = @sample.host_genome
    human_host_genome = appropriate_human_genome
    if host_genome.name == "Human"
      # if specified host was Human, make sure it uses appropriate genome
      host_genome = human_host_genome
    end

    sfn_pipeline_input_json = {
      HOST_FILTER_WDL_URI: "s3://#{S3_WORKFLOWS_BUCKET}/#{@pipeline_run.workflow_version_tag}/host_filter.wdl",
      NON_HOST_ALIGNMENT_WDL_URI: "s3://#{S3_WORKFLOWS_BUCKET}/#{@pipeline_run.workflow_version_tag}/non_host_alignment.wdl",
      POSTPROCESS_WDL_URI: "s3://#{S3_WORKFLOWS_BUCKET}/#{@pipeline_run.workflow_version_tag}/postprocess.wdl",
      EXPERIMENTAL_WDL_URI: "s3://#{S3_WORKFLOWS_BUCKET}/#{@pipeline_run.workflow_version_tag}/experimental.wdl",
      STAGES_IO_MAP_JSON: "s3://#{S3_WORKFLOWS_BUCKET}/#{@pipeline_run.workflow_version_tag}/stage_io_map.json",
      Input: {
        HostFilter: if pipeline_version_uses_new_host_filtering_stage(@pipeline_run.pipeline_version)
                      new_host_filtering_inputs(host_genome, human_host_genome)
                    else
                      {
                        fastqs_0: File.join(@sample.sample_input_s3_path, @sample.input_files.fastq[0].name),
                        fastqs_1: @sample.input_files.fastq[1] ? File.join(@sample.sample_input_s3_path, @sample.input_files.fastq[1].name) : nil,
                        file_ext: @sample.fasta_input? ? "fasta" : "fastq",
                        nucleotide_type: @sample.metadata.find_by(key: "nucleotide_type")&.string_validated_value || "",
                        host_genome: host_genome.name.downcase,
                        adapter_fasta: PipelineRun::ADAPTER_SEQUENCES[@sample.input_files.fastq[1] ? "paired-end" : "single-end"],
                        star_genome: host_genome.s3_star_index_path,
                        bowtie2_genome: host_genome.s3_bowtie2_index_path,
                        human_star_genome: human_host_genome.s3_star_index_path,
                        human_bowtie2_genome: human_host_genome.s3_bowtie2_index_path,
                        max_input_fragments: @pipeline_run.max_input_fragments,
                        max_subsample_fragments: @pipeline_run.subsample,
                      }
                    end, NonHostAlignment: {
                      lineage_db: @pipeline_run.alignment_config.s3_lineage_path,
                      accession2taxid_db: @pipeline_run.alignment_config.s3_accession2taxid_path,
                      taxon_blacklist: @pipeline_run.alignment_config.s3_taxon_blacklist_path,
                      index_dir_suffix: @pipeline_run.alignment_config.index_dir_suffix,
                      use_deuterostome_filter: @sample.skip_deutero_filter_flag != 1,
                      deuterostome_db: @pipeline_run.alignment_config.s3_deuterostome_db_path,
                      minimap2_db: @pipeline_run.alignment_config.minimap2_short_db_path,
                      diamond_db: @pipeline_run.alignment_config.diamond_db_path,
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
                      fastqs_0: File.join(@sample.sample_input_s3_path, @sample.input_files.fastq[0].name),
                      fastqs_1: @sample.input_files.fastq[1] ? File.join(@sample.sample_input_s3_path, @sample.input_files.fastq[1].name) : nil,
                      nt_db: @pipeline_run.alignment_config.s3_nt_db_path,
                      nt_loc_db: @pipeline_run.alignment_config.s3_nt_loc_db_path,
                      file_ext: @sample.fasta_input? ? "fasta" : "fastq",
                      nt_info_db: @pipeline_run.alignment_config.s3_nt_info_db_path || PipelineRunStage.default_s3_nt_info_db_path,
                    },
      },
      OutputPrefix: output_prefix,
    }
    sfn_extra_inputs = @pipeline_run.parse_dag_vars
    resp = AwsClient[:sts].get_caller_identity
    docker_image_id = "#{resp[:account]}.dkr.ecr.#{AwsUtil::AWS_REGION}.amazonaws.com/#{WorkflowRun::WORKFLOW[:short_read_mngs]}:v#{@pipeline_run.wdl_version}"
    sfn_pipeline_input_json[:Input].keys.each do |step|
      if sfn_extra_inputs.key?(step.to_s)
        sfn_pipeline_input_json[:Input][step].merge!(sfn_extra_inputs[step.to_s])
      end
      sfn_pipeline_input_json[:Input][step][:s3_wd_uri] = "#{output_prefix}/#{@pipeline_run.version_key_subpath}"
      sfn_pipeline_input_json[:Input][step][:docker_image_id] = docker_image_id
    end
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
