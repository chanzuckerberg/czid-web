class SfnPhyloTreeNgDispatchService
  # This service is responsible for dispatching a request to the
  # Phylo Tree NG Step Functions-based pipeline.
  # It generates the Step Function's input JSON and starts SFN execution

  include Callable
  include ParameterSanitization

  class SfnArnMissingError < StandardError
    def initialize
      super("SFN_SINGLE_WDL_ARN not set on App Config.")
    end
  end

  class SfnVersionMissingError < StandardError
    def initialize
      super("WDL version for phylotree-ng not set.")
    end
  end

  def initialize(phylo_tree_ng)
    @phylo_tree = phylo_tree_ng

    @sfn_arn = AppConfigHelper.get_app_config(AppConfig::SFN_SINGLE_WDL_ARN)
    raise SfnArnMissingError if @sfn_arn.blank?

    @wdl_version = AppConfigHelper.get_workflow_version("phylotree-ng")
    raise SfnVersionMissingError if @wdl_version.blank?

    @phylo_tree.update(
      wdl_version: @wdl_version
    )
  end

  def call
    sfn_input_json = generate_wdl_input
    sfn_execution_arn = dispatch(sfn_input_json)

    if sfn_execution_arn.blank?
      @phylo_tree.update(
        status: WorkflowRun::STATUS[:failed]
      )

      visualization = Visualization.where(data: { "treeNgId" => @phylo_tree.id }).last
      visualization.update(status: WorkflowRun::STATUS[:failed])
    else
      @phylo_tree.update(
        executed_at: Time.now.utc,
        s3_output_prefix: output_prefix,
        sfn_execution_arn: sfn_execution_arn,
        status: WorkflowRun::STATUS[:running]
      )

      visualization = Visualization.where(data: { "treeNgId" => @phylo_tree.id }).last
      visualization.update(status: WorkflowRun::STATUS[:running])

      Rails.logger.info("PhyloTreeNg: id=#{@phylo_tree.id} sfn_execution_arn=#{sfn_execution_arn}")
    end

    return {
      sfn_input_json: sfn_input_json,
      sfn_execution_arn: sfn_execution_arn,
    }
  rescue StandardError => err
    # Set to failed and re-raise
    @phylo_tree.update(status: WorkflowRun::STATUS[:failed])

    visualization = Visualization.where(data: { "treeNgId" => @phylo_tree.id }).last
    visualization.update(status: WorkflowRun::STATUS[:failed])

    LogUtil.log_error(
      "Error starting Phylo Tree SFN pipeline for tree #{@phylo_tree.id}: #{err}",
      exception: err,
      workflow_run_id: @phylo_tree.id,
      sfn_execution_arn: sfn_execution_arn
    )
    raise
  end

  private

  def output_prefix
    "s3://#{ENV['SAMPLES_BUCKET_NAME']}/phylotree-ng/#{@phylo_tree.id}/results"
  end

  def sample_input(pipeline_run)
    {
      workflow_run_id: pipeline_run.id,
      combined_contig_summary: pipeline_run.s3_file_for("contig_counts"),
      contig_fasta: pipeline_run.contigs_fasta_s3_path,
      sample_name: pipeline_run.sample.name,
    }
  end

  def generate_wdl_input
    resp = AwsClient[:sts].get_caller_identity
    docker_image_id = "#{resp[:account]}.dkr.ecr.#{AwsUtil::AWS_REGION}.amazonaws.com/phylotree-ng:v#{@wdl_version}"
    run_inputs = {
      additional_reference_accession_ids: @phylo_tree.inputs_json&.[]("additional_reference_accession_ids"),
      reference_taxon_id: @phylo_tree.inputs_json&.[]("tax_id"),
      samples: @phylo_tree.pipeline_runs.map { |pipeline_run| sample_input(pipeline_run) },
      superkingdom_name: @phylo_tree.inputs_json&.[]("superkingdom_name"),
      docker_image_id: docker_image_id,
    }

    sfn_pipeline_input_json = {
      RUN_WDL_URI: "s3://#{S3_WORKFLOWS_BUCKET}/#{@phylo_tree.version_tag}/run.wdl",
      Input: {
        Run: run_inputs,
      },
      OutputPrefix: output_prefix,
    }
    return sfn_pipeline_input_json
  end

  def dispatch(sfn_input_json)
    sfn_name = "idseq-#{Rails.env}-phylotree-ng-#{@phylo_tree.id}-#{Time.zone.now.strftime('%Y%m%d%H%M%S')}"
    sfn_input = JSON.dump(sfn_input_json)
    resp = AwsClient[:states].start_execution(state_machine_arn: @sfn_arn,
                                              name: sfn_name,
                                              input: sfn_input)
    return resp[:execution_arn]
  end
end
