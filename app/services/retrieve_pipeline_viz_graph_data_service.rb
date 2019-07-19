class RetrievePipelineVizGraphDataService
  include Callable
  # For step descriptions.
  # TODO(ezhong): Move to server-fed descriptions.
  include PipelineRunsHelper

  # Structures dag_json of each stage of the pipeline run into the following in @results for drawing
  # the pipeline visualization graphs on the React side:
  # stages: An array of stages, each stage being an object with the following fields:
  #     - jobStatus: The job status of the stage
  #     - steps: Array of objects, each one defining a node in that stage's graph. This object
  #       is composed of:
  #           - stepName: The name to be displayed for this step
  #               - inputEdges: An array of indices that map to edges in the @edges array (see below), each
  #                 edge being an input edge to the node.
  #               - ouputEdges: An array of indices that map to edges in the @edges array, each edge being an
  #                 output edge from the node
  #
  # edges: An array of edges, each edge object having the following structure:
  #     - from: An object containing a stageIndex and stepIndex, denoting the originating node it is from
  #     - to: An object containing a stageIndex and stepIndex, denoating the node it ends after
  #     - files: An array of file objects that get passed between the from and to nodes. It is composed of:
  #           - displayName: A string to display the file as
  #           - url: An optional string to download the file

  def initialize(pipeline_run_id, is_admin, remove_host_filtering_urls)
    @pipeline_run = PipelineRun.find(pipeline_run_id)
    @all_dag_jsons = []
    @stage_names = []
    @pipeline_run.pipeline_run_stages.each do |stage|
      if stage.name != "Experimental" || is_admin
        @all_dag_jsons.push(JSON.parse(stage.dag_json || "{}"))
        @stage_names.push(stage.name)
      end
    end
    @remove_host_filtering_urls = remove_host_filtering_urls
  end

  def call
    stages = create_stage_nodes_scaffolding
    edges = create_edges
    populate_nodes_with_edges(stages, edges)

    return { stages: stages, edges: edges }
  end

  private

  def create_stage_nodes_scaffolding
    stages = @all_dag_jsons.map.with_index do |dag_json, stage_index|
      stage_step_descriptions = STEP_DESCRIPTIONS[@stage_names[stage_index]]["steps"]
      steps = dag_json["steps"].map do |step|
        {
          name: modify_step_name(step["class"]),
          description: stage_step_descriptions[step["out"]],
          inputEdges: [],
          outputEdges: []
        }
      end

      {
        steps: steps,
        jobStatus: dag_json[:job_status]
      }
    end
    return stages
  end

  def create_edges
    file_path_to_info = {}
    @pipeline_run.sample.results_folder_files(@pipeline_run.pipeline_version).each do |file_entry|
      file_path_to_info[file_entry[:key]] = file_entry
    end

    file_path_to_outputting_step = {}
    file_path_to_inputting_steps = {}
    all_file_paths = Set.new
    @all_dag_jsons.each_with_index do |stage_dag_json, stage_index|
      stage_dag_json["steps"].each_with_index do |step, step_index|
        stage_dag_json["targets"][step["out"]].each do |file_name|
          file_path = "#{stage_dag_json['output_dir_s3']}/#{@pipeline_run.pipeline_version}/#{file_name}"
          file_path_to_outputting_step[file_path] = { stageIndex: stage_index, stepIndex: step_index }
          all_file_paths.add file_path
        end

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
            file_path_to_inputting_steps[file_path].push(stageIndex: stage_index, stepIndex: step_index)
            all_file_paths.add file_path
          end
        end
      end
    end

    input_output_to_file_paths = {}
    all_file_paths.to_a.each do |file_path|
      output_info = file_path_to_outputting_step[file_path]
      (file_path_to_inputting_steps[file_path] ? file_path_to_inputting_steps[file_path] : [nil]).each do |input_info|
        from_to_json = { from: output_info, to: input_info }.to_json

        unless input_output_to_file_paths.key? from_to_json
          input_output_to_file_paths[from_to_json] = []
        end
        input_output_to_file_paths[from_to_json].push(file_path)
      end
    end

    edges = []
    input_output_to_file_paths.each do |input_output_json, file_paths|
      edge_info = JSON.parse(input_output_json, symbolize_names: true)
      files = file_paths.map do |file_path|
        file_path = file_path.split('/', 4).last # Remove s3://idseq-.../ to match key
        file_info = file_path_to_info[file_path]
        display_name = file_info ? file_info[:display_name] : file_path.split("/").last
        url = file_info ? file_info[:url] : nil
        { displayName: display_name, url: url }
      end

      edges.push(from: edge_info[:from],
                 to: edge_info[:to],
                 files: files,
                 isIntraStage: (edge_info[:to] && edge_info[:from] && edge_info[:to][:stageIndex] == edge_info[:from][:stageIndex]) || false)
    end

    @remove_host_filtering_urls && remove_host_filtering_urls(edges)
    return edges
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
    step_name.gsub(/^(PipelineStep(Run|Generate)?)/, "")
  end

  def remove_host_filtering_urls(edges)
    edges.each do |edge|
      if (edge[:to] && edge[:to][:stageIndex].zero?) || edge[:from].nil?
        edge[:files].each { |file| file[:url] = nil }
      end
    end
  end
end
