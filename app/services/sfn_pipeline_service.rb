class SfnPipelineService
  # This service is responsible for dispatching a request to the
  # StepFunctions-based pipeline

  include Callable

  def initialize(pipeline_run)
    @pipeline_run = pipeline_run
    @sample = pipeline_run.sample
  end

  def call
    stage_dags_json = generate_dag_stages_json
    sfn_input_json = generate_wdl_input(stage_dags_json)
  #   sfn_arn = trigger_sfn_pipeline(sfn_input_json) if sfn_input_json
    return {
      stage_dags_json: stage_dags_json,
      sfn_input_json: sfn_input_json
  #     sfn_arn: sfn_arn,
  }
  end

  def generate_dag_stages_json
    # For compatibility with the legacy DAG json.
    # Generates a JSON composed by the jsons of all four stages in the DAG pipeline.
    stages_json = {}
    @pipeline_run.pipeline_run_stages.order(:step_number).each do |prs|
      puts "prs: #{prs}"
      stage_info = PipelineRunStage::STAGE_INFO[prs.step_number]
      stages_json[stage_info[:dag_name]] = prs.send(stage_info[:json_generation_func])
    end
    return stages_json
  end

  def convert_dag_json_to_wdl(dag_json)
    dag_tmp_file = Tempfile.new
    dag_tmp_file.write(JSON.dumps(stages_json))
    dag_tmp_file.close
    _stdout, _stderr, status = Open3.capture3("app/jobs/idd2wdl.py", dag_tmp_file.path)
    if status.success?
      return stdout
    end
    LogUtil.log_err_and_airbrake("Command to convert dag to wdl failed ('idd2wdl.py'). Error: #{stderr}")
    return nil
  rescue => e
    LogUtil.log_backtrace(e)
    LogUtil.log_err_and_airbrake("Command to convert dag to wdl failed ('idd2wdl.py'). Error: #{e}")
    return nil
  ensure
    dag_tmp_file.unlink if dag_tmp_file
  end

  def generate_wdl_input(stage_dags_json)
    # initialize the sfn pipeline from the fastq inputs

    input_files_paths = @sample.input_files.map do |input_file|
      File.join(@sample.sample_input_s3_path, input_file.source)
    end
    sfn_pipeline_input_json = {
      Input: {
        HostFilter: input_files_paths.each_with_index.map{|path, i| ["fastqs_#{i}", path]}.to_h
      }
    }

    stage_dags_json.each_pair do |stage_name, stage_dag_json|
      stage_dag_json = convert_dag_json_to_wdl(stage)
      sfn_pipeline_input_json["#{stage.upcase}_WDL_URI"] = f"s3://#{WDL_BUCKET_NAME}/#{wdl_key}"
      # TODO: create the output path
      sfn_pipeline_input_json["#{stage.upcase}_OUTPUT_URI"] = f"s3://#{OUTPUTS_BUCKET_NAME}/#{output_key}"
    end
    return sfn_pipeline_input_json
  end

  def upload_wdl_json()
    # TODO: (MAYBE) upload the dag json file for debug
    # TODO: create the path to the file (samples path  + sfn-wdl + stage.wdl) and upload to s3
    # TODO: upload the file to s3
  end

  def trigger_sfn_pipeline(sfn_input_json)
    return nil unless upload_wdl_json(sfn_input_json)

    # TODO: call api to start sfn
  end

  def dispatch(wdl_input_json)
    # Dispatches a new pipeline run request through the Step Functions AWS API.
  end
end