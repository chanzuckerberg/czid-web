class SfnBenchmarkPipelineDispatchService
  # This service is responsible for dispatching a request to the
  # AMR Step Functions-based pipeline.
  # It generates the Step Function's input JSON and starts SFN execution

  SHORT_READ_MNGS_MAP = {
    "taxon_counts" => "czid_postprocess.refined_taxon_count_out_assembly_refined_taxon_counts_with_dcr_json",
    "contigs_fasta" => "czid_postprocess.assembly_out_assembly_contigs_fasta",
    "contigs_summary" => "czid_postprocess.contig_summary_out_assembly_combined_contig_summary_json",
  }.freeze

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
  end

  def call
    sfn_input_json = generate_wdl_input

    benchmark_wdl_version = AppConfigHelper.get_workflow_version(WorkflowRun::WORKFLOW[:benchmark])
    raise SfnVersionMissingError, @workflow_run.workflow if benchmark_wdl_version.blank?

    dispatch_output = SfnGenericDispatchService.call(
      @workflow_run,
      inputs_json: sfn_input_json,
      output_prefix: @workflow_run.sfn_output_path,
      wdl_file_name: WorkflowRun::DEFAULT_WDL_FILE_NAME,
      version: benchmark_wdl_version
    )

    @workflow_run.update(
      executed_at: Time.now.utc,
      sfn_execution_arn: dispatch_output[:sfn_execution_arn],
      status: WorkflowRun::STATUS[:running]
    )
  rescue StandardError => err
    # Set to failed and re-raise
    @workflow_run.update(status: WorkflowRun::STATUS[:failed])
    LogUtil.log_error(
      "Error starting Benchmark SFN pipeline for WorkflowRun #{@workflow_run.id}: #{err}",
      exception: err,
      workflow_run_id: @workflow_run.id
    )
    raise
  end

  private

  def generate_wdl_input
    # SECURITY: To mitigate pipeline command injection, ensure any interpolated string inputs are either validated or controlled by the server.
    run_ids = @workflow_run.inputs&.[]("run_ids")
    outputs = {}
    run_ids.each_with_index do |run_id, index|
      run_number = "run_#{index + 1}" # WDL accepts run_1, run_2, etc. as inputs (starting at 1)
      outputs = outputs.merge(get_output_files(run_id, run_number))
    end

    {
      "workflow_type": @workflow_run.inputs&.[]("workflow_benchmarked"),
      "ground_truth": @workflow_run.inputs&.[]("ground_truth_file"),
    }.merge(outputs)
  end

  def get_output_files(run_id, run_number)
    if WorkflowRun::MNGS_WORKFLOWS.include?(@workflow_run.inputs&.[]("workflow_benchmarked"))
      get_mngs_output_files(run_id, run_number)
    else
      {}
    end
  end

  def get_mngs_output_files(run_id, run_number)
    workflow = @workflow_run.inputs&.[]("workflow_benchmarked")

    run = if WorkflowRun::MNGS_WORKFLOWS.include?(workflow)
            PipelineRun.find(run_id)
          else
            WorkflowRun.find(run_id)
          end
    results_path = run.sfn_results_path

    output_hash = {}
    PipelineRunStage::DAG_NAME_BY_STAGE_NAME.values.each do |stage|
      output_hash = output_hash.merge(JSON.parse(S3Util.get_s3_file("#{results_path}/#{stage}_output.json")))
    end

    return {
      "taxon_counts_#{run_number}": output_hash[SHORT_READ_MNGS_MAP["taxon_counts"]],
      "contig_fasta_#{run_number}": output_hash[SHORT_READ_MNGS_MAP["contigs_fasta"]],
      "contig_summary_#{run_number}": output_hash[SHORT_READ_MNGS_MAP["contigs_summary"]],
    }
  end
end
