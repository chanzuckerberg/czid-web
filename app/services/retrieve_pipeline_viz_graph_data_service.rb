class RetrievePipelineVizGraphDataService
  include Callable
  include PipelineRunsHelper # For step descriptions

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
  #     - files: An array of files that get passed between the from and to nodes. Currently each file is a string,
  #       but it may become an object containing download url and potentially other information.

  def initialize(pipeline_run_id, is_admin)
    @pipeline_run = PipelineRun.find(pipeline_run_id)
    @all_dag_jsons = []
    @stage_names = []
    @pipeline_run.pipeline_run_stages.each do |stage|
      if stage.name != "Experimental" || is_admin
        @all_dag_jsons.push(JSON.parse(stage.dag_json || "{}"))
        @stage_names.push(stage.name)
      end
    end
  end

  def call
    stages = create_stage_nodes_scaffolding
    edges = create_edges
    populate_nodes_with_edges(stages, edges)
    add_final_outputs_edges(stages, edges)

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
    edges = []
    @all_dag_jsons.each_with_index do |dag_json, stage_index|
      edges.concat(intra_stage_edges(dag_json, stage_index))
    end
    edges.concat(inter_stage_edges)
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

  def intra_stage_edges(stage_dag_json, stage_index)
    target_to_outputting_step = {}
    stage_dag_json["steps"].each_with_index do |step, step_index|
      target_to_outputting_step[step["out"]] = step_index
    end

    edges = []
    stage_dag_json["steps"].each_with_index do |step, to_step_index|
      step["in"].each do |in_target|
        from_step_index = target_to_outputting_step[in_target]
        unless from_step_index.nil?
          # TODO(ezhong): Include file download links for files.
          files = stage_dag_json["targets"][in_target]
          edges.push(from: {
                       stageIndex: stage_index,
                       stepIndex: from_step_index
                     }, to: {
                       stageIndex: stage_index,
                       stepIndex: to_step_index
                     },
                     files: files,
                     isIntraStage: true)
        end
      end
    end
    return edges
  end

  def inter_stage_edges
    file_path_to_outputting_step = {}
    @all_dag_jsons.each_with_index do |stage_dag_json, stage_index|
      stage_dag_json["steps"].each_with_index do |step, step_index|
        stage_dag_json["targets"][step["out"]].each do |file_name|
          file_path = "#{stage_dag_json['output_dir_s3']}/#{@pipeline_run.pipeline_version}/#{file_name}"
          file_path_to_outputting_step[file_path] = { stageIndex: stage_index, stepIndex: step_index }
        end
      end
    end

    edges = []
    @all_dag_jsons.each_with_index do |stage_dag_json, to_stage_index|
      stage_dag_json["steps"].each_with_index do |step, to_step_index|
        # Group files with the same outputting step, as they lie on the same edge.
        outputting_step_to_files = {}

        step["in"].each do |in_target|
          if stage_dag_json["given_targets"].key? in_target
            dir_path = stage_dag_json["given_targets"][in_target]["s3_dir"]
            stage_dag_json["targets"][in_target].each do |file_name|
              file_path = "#{dir_path}/#{file_name}"
              outputting_step_info = file_path_to_outputting_step[file_path]
              unless outputting_step_to_files.key?(outputting_step_info)
                outputting_step_to_files[outputting_step_info] = []
              end
              outputting_step_to_files[outputting_step_info].push(file_name)
            end
          end
        end

        outputting_step_to_files.each do |outputting_step_info, files|
          edges.push(from: outputting_step_info,
                     to: {
                       stageIndex: to_stage_index,
                       stepIndex: to_step_index
                     },
                     # TODO(ezhong): Include file download links for files.
                     files: files,
                     isIntraStage: false)
        end
      end
    end
    return edges
  end

  def add_final_outputs_edges(stage_step_data, edge_data)
    stage_step_data.each_with_index do |stage, stage_index|
      stage[:steps].each_with_index do |step, step_index|
        if step[:outputEdges].empty?
          dag_json = @all_dag_jsons[stage_index]
          out_target = dag_json["steps"][step_index]["out"]
          edge_data.push(from: { stageIndex: stage_index, stepIndex: step_index },
                         files: dag_json["targets"][out_target])
          step[:outputEdges].push(edge_data.length - 1)
        end
      end
    end
  end

  def modify_step_name(step_name)
    step_name.gsub(/^(PipelineStep(Run|Generate)?)/, "")
  end
end
