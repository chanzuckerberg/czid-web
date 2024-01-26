class SfnLongReadMngsPipelineDispatchService
  # This service is responsible for dispatching a request to the
  # Long Read Metagenomics Step Functions-based pipeline.
  # It generates the Step Function's input JSON and starts SFN execution

  include Callable
  include ParameterSanitization

  WORKFLOW_NAME = WorkflowRun::WORKFLOW[:long_read_mngs]

  ERCC_DIRECTORY_PATH = "s3://czid-public-references/host_filter/ercc/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime".freeze
  # CZID-8173: \/\/ Provided for old projects. See below comments for why it's here.
  DEPRECATED_HUMAN_HG38_S3_MINIMAP2_INDEX_PATH = "s3://idseq-public-references/host_filter/human/2018-02-15-utc-1518652800-unixtime__2018-02-15-utc-1518652800-unixtime/hg38_phiX_rRNA_mito_ERCC.fasta".freeze

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

    @wdl_version = pipeline_run.pipeline_branch || VersionRetrievalService.call(@sample.project.id, WORKFLOW_NAME)
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

  # Get correct type of minimap db for host genome by library type (dna vs rna)
  def minimap_path_by_library_type(library_type, host_genome)
    if library_type.casecmp("dna").zero?
      host_genome.s3_minimap2_dna_index_path || "#{ERCC_DIRECTORY_PATH}/ercc_minimap2_genome_dna.mmi"
    else
      host_genome.s3_minimap2_rna_index_path || "#{ERCC_DIRECTORY_PATH}/ercc_minimap2_genome_rna.mmi"
    end
  end

  # CZID-8173: We occasionally update the version of our human host genome.
  # However, we want to avoid disrupting old projects, so when a project is created
  # we pin the human version to keep human genome consistent throughout a project.
  def appropriate_human_genome
    human_host_version = VersionRetrievalService.call(@sample.project.id, HostGenome::HUMAN_HOST)
    HostGenome.find_by(name: "Human", version: human_host_version)
  end

  def minimap_host_path(library_type, host_genome)
    if host_genome.name == "Human"
      # if specified host was Human, make sure it uses appropriate genome
      host_genome = appropriate_human_genome
    end
    minimap_path_by_library_type(library_type, host_genome)
  end

  # CZID-8173: When we only had a single human host genome (Human v1, aka HG38)
  # we used a combined file that handled both DNA and RNA case. Downside was it
  # was less optimized. We continue to provide it for old, Human v1 projects.
  def minimap_human_path(library_type)
    human_host_genome = appropriate_human_genome
    if human_host_genome.version == 1
      DEPRECATED_HUMAN_HG38_S3_MINIMAP2_INDEX_PATH
    else
      minimap_path_by_library_type(library_type, human_host_genome)
    end
  end

  def generate_wdl_input
    library_type = @sample.metadata.find_by(key: "nucleotide_type")&.string_validated_value || ""
    host_genome = @sample.host_genome
    {
      RUN_WDL_URI: "s3://#{S3_WORKFLOWS_BUCKET}/#{@pipeline_run.workflow_version_tag}/run.wdl",
      Input: {
        Run: {
          input_fastq: File.join(@sample.sample_input_s3_path, @sample.input_files.fastq[0].name),
          library_type: library_type,
          guppy_basecaller_setting: @pipeline_run.guppy_basecaller_setting,
          minimap_host_db: minimap_host_path(library_type, host_genome),
          minimap_human_db: minimap_human_path(library_type),
          subsample_depth: @sample.subsample, # optional input specified in Admin Options
          lineage_db: @pipeline_run.alignment_config.s3_lineage_path,
          accession2taxid_db: @pipeline_run.alignment_config.s3_accession2taxid_path,
          taxon_blacklist: @pipeline_run.alignment_config.s3_taxon_blacklist_path,
          deuterostome_db: @pipeline_run.alignment_config.s3_deuterostome_db_path,
          docker_image_id: retrieve_docker_image_id,
          minimap2_db: @pipeline_run.alignment_config.minimap2_long_db_path,
          diamond_db: @pipeline_run.alignment_config.diamond_db_path,
          s3_wd_uri: "#{output_prefix}/#{@pipeline_run.version_key_subpath}",
          nt_info_db: @pipeline_run.alignment_config.s3_nt_info_db_path,
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
