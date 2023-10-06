class SfnAmrPipelineDispatchService
  # This service is responsible for dispatching a request to the
  # AMR Step Functions-based pipeline.
  # It generates the Step Function's input JSON and starts SFN execution

  include Callable
  include ParameterSanitization

  class SfnArnMissingError < StandardError
    def initialize
      super("SFN_SINGLE_WDL_ARN and SFN_AMR_ARN not set on App Config.")
    end
  end

  class SfnVersionMissingError < StandardError
    def initialize(workflow)
      super("WDL version for '#{workflow}' not set.")
    end
  end

  def initialize(workflow_run)
    @workflow_run = workflow_run.workflow_by_class
    @sample = workflow_run.sample
    @current_user = User.find(@sample.user_id)

    @sfn_arn = AppConfigHelper.get_app_config(AppConfig::SFN_SINGLE_WDL_ARN) || AppConfigHelper.get_app_config(AppConfig::SFN_AMR_ARN)
    raise SfnArnMissingError if @sfn_arn.blank?

    @wdl_version = PipelineVersionControlService.call(@sample.project.id, @workflow_run.workflow)
    raise SfnVersionMissingError, @workflow_run.workflow if @wdl_version.blank?

    # AMR uses the host filtering stage of the mNGS pipeline
    @mngs_wdl_version = AppConfigHelper.get_workflow_version(WorkflowRun::WORKFLOW[:short_read_mngs])

    if @current_user.allowed_feature_list.include?("modern_host_filtering")
      @wdl_version = AppConfigHelper.get_app_config(AppConfig::MODERN_AMR_VERSION)
      @mngs_wdl_version = AppConfigHelper.get_app_config(AppConfig::MODERN_SHORT_READ_MNGS_VERSION)
    end

    @workflow_run.update(
      wdl_version: @wdl_version
    )

    # Get latest CARD versions and write them to inputs_json
    versions = @workflow_run.uses_modern_host_filtering? ? AmrWorkflowRun.latest_card_versions : AmrWorkflowRun::DEFAULT_CARD_VERSIONS
    @workflow_run.add_inputs(versions)

    @start_from_mngs = strtrue(@workflow_run.get_input("start_from_mngs"))
    @latest_pipeline_run = @start_from_mngs ? @sample.pipeline_runs.non_deprecated.first : nil
  end

  def call
    sfn_input_json = generate_wdl_input
    sfn_execution_arn = dispatch(sfn_input_json)

    if sfn_execution_arn.blank?
      @workflow_run.update(
        status: WorkflowRun::STATUS[:failed]
      )
    else
      @workflow_run.update(
        executed_at: Time.now.utc,
        s3_output_prefix: output_prefix,
        sfn_execution_arn: sfn_execution_arn,
        status: WorkflowRun::STATUS[:running]
      )
      Rails.logger.info("WorkflowRun: id=#{@workflow_run.id} sfn_execution_arn=#{sfn_execution_arn}")
    end

    return {
      sfn_input_json: sfn_input_json,
      sfn_execution_arn: sfn_execution_arn,
    }
  rescue StandardError => err
    # Set to failed and re-raise
    @workflow_run.update(status: WorkflowRun::STATUS[:failed])
    LogUtil.log_error(
      "Error starting AMR SFN pipeline for WorkflowRun #{@workflow_run.id}: #{err}",
      exception: err,
      workflow_run_id: @workflow_run.id,
      sfn_execution_arn: sfn_execution_arn
    )
    raise
  end

  private

  def retrieve_docker_image_id
    resp = AwsClient[:sts].get_caller_identity
    return "#{resp[:account]}.dkr.ecr.#{AwsUtil::AWS_REGION}.amazonaws.com/amr:v#{@workflow_run.wdl_version}"
  end

  def retrieve_mngs_docker_image_id
    resp = AwsClient[:sts].get_caller_identity
    return "#{resp[:account]}.dkr.ecr.#{AwsUtil::AWS_REGION}.amazonaws.com/#{WorkflowRun::WORKFLOW[:short_read_mngs]}:v#{@mngs_wdl_version}"
  end

  def output_prefix
    "s3://#{ENV['SAMPLES_BUCKET_NAME']}/#{@sample.sample_path}/#{@workflow_run.id}"
  end

  def strtrue(str)
    str == "true"
  end

  def host_filtering_parameters
    hg = @sample.host_genome
    {
      "host_filtering_docker_image_id": retrieve_mngs_docker_image_id,
      "host_filter_stage.file_ext": @sample.fasta_input? ? "fasta" : "fastq",
      "host_filter_stage.nucleotide_type": @sample.metadata.find_by(key: "nucleotide_type")&.string_validated_value || "",
      "host_filter_stage.host_genome": hg.name.downcase,
      "host_filter_stage.star_genome": hg.s3_star_index_path,
      "host_filter_stage.bowtie2_genome": hg.s3_bowtie2_index_path,
      "host_filter_stage.human_star_genome": HostGenome.find_by(name: "Human").s3_star_index_path,
      "host_filter_stage.human_bowtie2_genome": HostGenome.find_by(name: "Human").s3_bowtie2_index_path,
      "host_filter_stage.adapter_fasta": PipelineRun::ADAPTER_SEQUENCES[@sample.input_files[1] ? "paired-end" : "single-end"],
      "host_filter_stage.max_input_fragments": PipelineRun::DEFAULT_MAX_INPUT_FRAGMENTS,
      "host_filter_stage.max_subsample_fragments": PipelineRun::DEFAULT_SUBSAMPLING,
    }
  end

  def modern_host_filtering_parameters
    hg = @sample.host_genome
    {
      "host_filtering_docker_image_id": retrieve_mngs_docker_image_id,
      "host_filter_stage.adapter_fasta": PipelineRun::ADAPTER_SEQUENCES[@sample.input_files[1] ? "paired-end" : "single-end"],

      "host_filter_stage.host_genome": hg.name.downcase,
      "host_filter_stage.bowtie2_index_tar": hg.s3_bowtie2_index_path_v2,
      "host_filter_stage.hisat2_index_tar": hg.s3_hisat2_index_path,
      "host_filter_stage.kallisto_idx": hg.s3_kallisto_index_path,
      "host_filter_stage.human_bowtie2_index_tar": HostGenome.find_by(name: "Human").s3_bowtie2_index_path_v2,
      "host_filter_stage.human_hisat2_index_tar": HostGenome.find_by(name: "Human").s3_hisat2_index_path,

      "host_filter_stage.max_input_fragments": PipelineRun::DEFAULT_MAX_INPUT_FRAGMENTS,
      "host_filter_stage.max_subsample_fragments": PipelineRun::DEFAULT_SUBSAMPLING,
      "host_filter_stage.file_ext": @sample.fasta_input? ? "fasta" : "fastq",
    }
  end

  def card_params(uses_modern_host_filtering)
    # AMR pipeline versions before modern host filtering will
    # use default CARD version set in AMR WDL
    unless uses_modern_host_filtering
      return {}
    end

    # AMR pipeline versions using modern host filtering will
    # use the latest version of CARD available
    prefix = AmrWorkflowRun.latest_card_folder_path
    {
      card_json: "#{prefix}/card.json",
      card_ontology: "#{prefix}/ontology.json",
      kmer_db: "#{prefix}/61_kmer_db.json",
      amr_kmer_db: "#{prefix}/all_amr_61mers.txt",
      wildcard_data: "#{prefix}/wildcard_database.fasta",
      wildcard_index: "#{prefix}/index-for-model-sequences.txt",
    }
  end

  # For samples uploaded directly to the AMR pipeline
  def raw_reads
    @sample.input_file_s3_paths(InputFile::FILE_TYPE_FASTQ)
  end

  def reduplicated_reads_input_files
    # Samples with non-human hosts go through additional human filtering. Human samples will only have
    # files from the hisat2 host filter step.
    non_host_reads = if @sample.host_genome_name == "Human"
                       PipelineRun::HISAT2_HOST_FILTERED_NAMES
                     else
                       PipelineRun::HISAT2_HUMAN_FILTERED_NAMES
                     end
    params = if @start_from_mngs
               {
                 filtered_sample: {
                   subsampled_reads: PipelineRun::SUBSAMPLED_NAMES.map { |n| @latest_pipeline_run.s3_file_for_sfn_result(n) },
                   non_host_reads: non_host_reads.map { |n| @latest_pipeline_run.s3_file_for_sfn_result(n) },
                   clusters: @latest_pipeline_run.s3_file_for_sfn_result(PipelineRun::DUPLICATE_CLUSTERS_NAME),
                   cluster_sizes: @latest_pipeline_run.s3_file_for_sfn_result(PipelineRun::DUPLICATE_CLUSTER_SIZES_NAME),
                   contigs: @latest_pipeline_run.s3_file_for_sfn_result(PipelineRun::ASSEMBLED_CONTIGS_NAME),
                 },
               }
             else
               {
                 raw_sample: {
                   raw_reads: raw_reads,
                 },
               }
             end
    return params
  end

  def initial_version_input_files(non_host_reads)
    params = if @start_from_mngs
               {
                 non_host_reads: non_host_reads,
                 contigs: @latest_pipeline_run.s3_file_for_sfn_result(PipelineRun::ASSEMBLED_CONTIGS_NAME),
               }
             else
               {
                 raw_reads_0: raw_reads[0],
                 raw_reads_1: raw_reads[1], # will be nil for single-file samples
               }
             end
    return params
  end

  def input_files_params
    params = {}
    if @workflow_run.workflow_version_at_least(AmrWorkflowRun::VERSION[:REDUPLICATED_READS])
      params = reduplicated_reads_input_files
    elsif @workflow_run.workflow_version_at_least(AmrWorkflowRun::VERSION[:MODERN_HOST_FILTERING])
      files = if @start_from_mngs
                PipelineRun::SUBSAMPLED_NAMES.map { |n| @latest_pipeline_run.s3_file_for_sfn_result(n) }
              end
      params = initial_version_input_files(files)
    elsif @workflow_run.workflow_version_at_least(AmrWorkflowRun::VERSION[:INITIAL])
      files = if @start_from_mngs
                PipelineRun::GSNAP_FILTERED_NAMES.map { |n| @latest_pipeline_run.s3_file_for_sfn_result(n) }
              end
      params = initial_version_input_files(files)
    else
      raise SfnVersionMissingError, @workflow_run.workflow
    end
    return params
  end

  def generate_wdl_input
    # SECURITY: To mitigate pipeline command injection, ensure any interpolated string inputs are either validated or controlled by the server.
    host_filtering_params = @workflow_run.uses_modern_host_filtering? ? modern_host_filtering_parameters : host_filtering_parameters
    card_params = card_params(@workflow_run.uses_modern_host_filtering?)
    run_inputs = {
      docker_image_id: retrieve_docker_image_id,
      sample_name: @workflow_run.sample.name,
    }.merge(input_files_params, host_filtering_params, card_params)

    sfn_pipeline_input_json = {
      RUN_WDL_URI: "s3://#{S3_WORKFLOWS_BUCKET}/#{@workflow_run.workflow_version_tag}/run.wdl.zip",
      Input: {
        Run: run_inputs,
      },
      OutputPrefix: output_prefix,
    }
    return sfn_pipeline_input_json
  end

  def dispatch(sfn_input_json)
    sfn_name = "idseq-#{Rails.env}-#{@sample.project_id}-#{@sample.id}-#{@workflow_run.id}-#{Time.zone.now.strftime('%Y%m%d%H%M%S')}"
    sfn_input = JSON.dump(sfn_input_json)
    resp = AwsClient[:states].start_execution(state_machine_arn: @sfn_arn,
                                              name: sfn_name,
                                              input: sfn_input)
    return resp[:execution_arn]
  end
end
