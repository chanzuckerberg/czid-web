class PipelineVizDataServiceForSfn
  include Callable
  # PipelineRunsHelper includes default descriptions, before we can get them from the dag
  include PipelineRunsHelper
  include PipelineOutputsHelper

  # Structures dag_json of each stage of the pipeline run into the following in @results for drawing
  # the pipeline visualization graphs on the React side:
  # stages: An array of stages, each stage being an object with the following fields:
  #     - jobStatus: The job status of the stage
  #     - steps: Array of objects, each one defining a node in that stage's graph. This object
  #       is composed of:
  #           - name: The name to be displayed for this step. Currently, this corresponds to the name of the output target
  #             (works as there is a single output target per step).
  #           - description: The description for the step.
  #           - inputEdges: An array of indices that map to edges in the @edges array (see below), each
  #             edge being an input edge to the node.
  #           - ouputEdges: An array of indices that map to edges in the @edges array, each edge being an
  #             output edge from the node
  #           - status: The current status of the step at time of retrieval, as represented by a string
  #             (see JOB_STATUS_NUM_TO_STRING below for possible strings).
  #
  # edges: An array of edges, each edge object having the following structure:
  #     - from: An object containing a stageIndex and stepIndex, denoting the originating node it is from
  #     - to: An object containing a stageIndex and stepIndex, denoating the node it ends after
  #     - files: An array of file objects that get passed between the from and to nodes. It is composed of:
  #           - displayName: A string to display the file as
  #           - url: An optional string to download the file
  #
  # status: The status of the pipeline.

  def initialize(pipeline_run_id, see_experimental, remove_host_filtering_urls)
    @pipeline_run = PipelineRun.find(pipeline_run_id)
    @all_wdls = []
    @stage_names = []
    @stage_job_statuses = []
    @pipeline_run.pipeline_run_stages.each do |stage|
      if stage.dag_json && (stage.name != "Experimental" || see_experimental)
        @all_dag_jsons.push(JSON.parse(stage.dag_json || "{}"))
        @stage_names.push(stage.name)
        @stage_job_statuses.push(stage.job_status)
      end
    end
    @remove_host_filtering_urls = remove_host_filtering_urls
    @see_experimental = see_experimental
  end

  def call
    stages = create_stage_nodes_scaffolding
    edges = create_edges
    populate_nodes_with_edges(stages, edges)

    return { stages: stages, edges: edges, status: pipeline_job_status(stages) }
  end

  private

  def create_stage_nodes_scaffolding
    step_statuses_by_stage = @pipeline_run.step_statuses_by_stage
    stages = @all_dag_jsons.map.with_index do |dag_json, stage_index|
      stage_step_statuses = step_statuses_by_stage[stage_index]
      stage_step_descriptions = STEP_DESCRIPTIONS[@stage_names[stage_index]]["steps"]

      all_redefined_statuses = []
      steps = dag_json["steps"].map do |step|
        status_info = stage_step_statuses[step["out"]] || {}
        description = status_info["description"].blank? ? stage_step_descriptions[step["out"]] : status_info["description"]
        status = redefine_job_status(status_info["status"], @stage_job_statuses[stage_index])
        all_redefined_statuses << status
        {
          name: modify_step_name(step["out"]),
          description: description,
          inputEdges: [],
          outputEdges: [],
          status: status,
          startTime: status_info["start_time"],
          endTime: status_info["end_time"],
          resources: status_info["resources"].to_a.map { |name_and_url| { name: name_and_url[0], url: name_and_url[1] } },
        }
      end

      {
        steps: steps,
        jobStatus: stage_job_status(all_redefined_statuses),
      }
    end
    return stages
  end

  def redefine_job_status(step_status, stage_status)
    case step_status
    when "instantiated", nil
      "notStarted"
    when "uploaded"
      "finished"
    when "pipeline_errored"
      "pipelineErrored"
    when "errored", "user_errored"
      "userErrored"
    # finished_running occurs when the outputs have been created, but hasn't been uploaded to aws yet. Since the file
    # is not available to download yet, it is marked as "inProgress"
    when "running", "finished_running"
      # Should be errored if pipeline is killed and the step_status file isn't updated.
      stage_status == PipelineRunStage::STATUS_FAILED ? "pipelineErrored" : "inProgress"
    end
  end

  def stage_job_status(statuses)
    if statuses.include? "userErrored"
      return "userErrored"
    elsif statuses.include? "pipelineErrored"
      return "pipelineErrored"
    elsif statuses.include?("inProgress") || (statuses.include?("notStarted") && statuses.include?("finished"))
      return "inProgress"
    elsif statuses.include? "notStarted"
      return "notStarted"
    elsif statuses.include? "finished"
      return "finished"
    end
  end

  def pipeline_job_status(stages)
    existing_stages_status = stage_job_status(stages.map { |stage| stage[:jobStatus] })
    if existing_stages_status == "finished" && @all_dag_jsons.length != (@see_experimental ? 4 : 3)
      return "inProgress"
    end
    return existing_stages_status
  end

  def create_edges
    file_path_to_info = {}
    @pipeline_run.sample.results_folder_files(@pipeline_run.pipeline_version).each do |file_entry|
      file_path_to_info[file_entry[:key]] = file_entry
    end
    edges = input_output_to_file_paths.map do |input_output_json, file_paths|
      files = file_paths.map { |file_path| file_info(file_path, file_path_to_info) }
      edge_info = JSON.parse(input_output_json, symbolize_names: true)
      edge_info.merge(files: files,
                      isIntraStage: (edge_info.key?(:to) && edge_info.key?(:from) && edge_info[:to][:stageIndex] == edge_info[:from][:stageIndex]) || false)
    end
    @remove_host_filtering_urls && remove_host_filtering_urls(edges)
    return edges
  end

  def input_output_to_file_paths
    file_paths_to_input_outputs = file_path_to_inputting_steps
                                  .merge(file_path_to_outputting_step) do |_file_path, to_array, from|
      to_array.map { |to| to.merge(from) }
    end

    input_output_to_file_paths = {}
    file_paths_to_input_outputs.each do |file_path, input_outputs|
      # Convert those with only "from" and not "to", which are not arrays due to no conflicting keys in merge.
      unless input_outputs.is_a? Array
        input_outputs = [input_outputs]
      end

      input_outputs.each do |input_output|
        input_output = input_output.to_json
        unless input_output_to_file_paths.key? input_output
          input_output_to_file_paths[input_output] = []
        end
        input_output_to_file_paths[input_output].push(file_path)
      end
    end
    input_output_to_file_paths
  end

  def file_path_to_outputting_step
    file_path_to_outputting_step = {}
    step_statuses_by_stage = @pipeline_run.step_statuses_by_stage
    @all_dag_jsons.each_with_index do |stage_dag_json, stage_index|
      stage_dag_json["steps"].each_with_index do |step, step_index|
        stage_dag_json["targets"][step["out"]].each do |file_name|
          file_path = "#{stage_dag_json['output_dir_s3']}/#{@pipeline_run.pipeline_version}/#{file_name}"
          file_path_to_outputting_step[file_path] = { from: { stageIndex: stage_index, stepIndex: step_index } }
        end
        step_statuses = step_statuses_by_stage[stage_index]
        get_additional_outputs(step_statuses, step["out"]).each do |filename|
          file_path = "#{stage_dag_json['output_dir_s3']}/#{@pipeline_run.pipeline_version}/#{filename}"
          file_path_to_outputting_step[file_path] = { from: { stageIndex: stage_index, stepIndex: step_index } }
        end
      end
    end
    file_path_to_outputting_step
  end

  def file_path_to_inputting_steps
    file_path_to_inputting_steps = {}
    @all_dag_jsons.each_with_index do |stage_dag_json, stage_index|
      stage_dag_json["steps"].each_with_index do |step, step_index|
        step["in"].each do |in_target|
          stage_dag_json["targets"][in_target].each do |file_name|
            file_path = if stage_dag_json["given_targets"].key? in_target
                          "#{stage_dag_json['given_targets'][in_target]['s3_dir']}/#{file_name}"
                        else
                          "#{stage_dag_json['output_dir_s3']}/#{@pipeline_run.pipeline_version}/#{file_name}"
                        end

            unless file_path_to_inputting_steps.key? file_path
              file_path_to_inputting_steps[file_path] = []
            end
            file_path_to_inputting_steps[file_path].push(to: { stageIndex: stage_index, stepIndex: step_index })
          end
        end
      end
    end
    file_path_to_inputting_steps
  end

  def remove_bucket_from_s3_path(s3_path)
    s3_path.split('/', 4).last # Remove s3://idseq-.../ to match key
  end

  def file_info(file_path, file_path_to_info)
    file_path = remove_bucket_from_s3_path(file_path)
    file_info = file_path_to_info[file_path]
    display_name = file_info ? file_info[:display_name] : file_path.split("/").last
    url = file_info ? file_info[:url] : nil
    { displayName: display_name, url: url }
  end

  def populate_nodes_with_edges(stages_with_nodes, edges)
    edges.each_with_index do |edge, edge_index|
      if edge[:from]
        from_stage_index = edge[:from][:stageIndex]
        from_step_index = edge[:from][:stepIndex]
        stages_with_nodes[from_stage_index][:steps][from_step_index][:outputEdges].push(edge_index)
      end
      if edge[:to]
        to_stage_index = edge[:to][:stageIndex]
        to_step_index = edge[:to][:stepIndex]
        stages_with_nodes[to_stage_index][:steps][to_step_index][:inputEdges].push(edge_index)
      end
    end
  end

  def modify_step_name(step_name)
    step_name.gsub(/(_out)$/, "").titleize
  end

  def remove_host_filtering_urls(edges)
    # Removing host filtering URLs is important because the host filtering files
    #  may contain PGI. Removing the urls stops them from being downloadable.
    edges.each do |edge|
      to_host_filtering = edge[:to] && edge[:to][:stageIndex].zero?
      from_nowhere = edge[:from].nil?
      # Also remove the URLs of additional output from the host filtering stage
      #  Additional output has no :to so it won't be caught in `to_host_filtering`.
      #  These are removed for safety (in case one is added that still contains PGI)
      #  and so that they are consist with the other host filtering files.
      host_filtering_additional_output = edge[:from] && edge[:from][:stageIndex].zero? && edge[:to].nil?
      if to_host_filtering || from_nowhere || host_filtering_additional_output
        edge[:files].each { |file| file[:url] = nil }
      end
    end
  end
end
