class PipelineVizController < ApplicationController
  before_action :authenticate_user!

  # GET /sample/:sample_id/pipeline_viz/:pipeline_version
  # GET /sample/:sample_id/pipeline_viz/:pipeline_version.json
  def show
    feature_allowed = current_user.allowed_feature_list.include?("pipeline_viz")
    sample = current_power.samples.find_by(id: params[:sample_id])
    pipeline_version = params[:pipeline_version]
    pipeline_run = sample && (
      pipeline_version ? sample.pipeline_runs.where(pipeline_version: pipeline_version)[0] : sample.first_pipeline_run
    )

    if feature_allowed && pipeline_run
      @stages = []
      @edges = []
      all_stage_dag_jsons = []
      pipeline_run.pipeline_run_stages.each_with_index do |stage, stage_index|
        if stage.name != "Experimental" || current_user.admin?
          stage_dag_json = JSON.parse(stage.dag_json || "{}")
          stage_nodes = stage_node_scaffolding(stage_dag_json)

          stage_edges = intra_stage_edges(stage_dag_json, stage_index)
          stage_edges.each_with_index do |edge, edge_index|
            if edge[:isIntraStage]
              # Offset index for correct value after concatination later
              stage_nodes[edge[:from][:stepIndex]][:outputEdges].push(edge_index + @edges.length)
              stage_nodes[edge[:to][:stepIndex]][:inputEdges].push(edge_index + @edges.length)
            end
          end
          @edges.concat(stage_edges)

          @stages.push(steps: stage_nodes,
                       jobStatus: stage.job_status)
          all_stage_dag_jsons.push(stage_dag_json)
        end
      end

      between_stage_edges = inter_stage_edges(all_stage_dag_jsons, pipeline_run.pipeline_version)
      between_stage_edges.each_with_index do |edge, edge_index|
        # Offset index for correct value after concatination later
        if edge[:from]
          from_stage_index = edge[:from][:stageIndex]
          from_step_index = edge[:from][:stepIndex]
          @stages[from_stage_index][:steps][from_step_index][:outputEdges].push(edge_index + @edges.length)
        end
        if edge[:to]
          to_stage_index = edge[:to][:stageIndex]
          to_step_index = edge[:to][:stepIndex]
          @stages[to_stage_index][:steps][to_step_index][:inputEdges].push(edge_index + @edges.length)
        end
      end
      @edges.concat(between_stage_edges)

      add_final_outputs_edges(@stages, @edges, all_stage_dag_jsons)

      respond_to do |format|
        format.html
        format.json { render json: { stages: @stages, edges: @edges } }
      end
    else
      status = !feature_allowed ? :unauthorized : :not_found
      render(json: {
               status: status,
               message: "Cannot access feature"
             }, status: status)
    end
  end

  def stage_node_scaffolding(stage_dag_json)
    nodes = []
    stage_dag_json["steps"].each do |step|
      nodes.push(name: modify_step_name(step["class"]),
                 inputEdges: [],
                 outputEdges: [])
    end
    return nodes
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

  def inter_stage_edges(all_dag_jsons, pipeline_version)
    file_path_to_outputting_step = {}

    all_dag_jsons.each_with_index do |stage_dag_json, stage_index|
      stage_dag_json["steps"].each_with_index do |step, step_index|
        stage_dag_json["targets"][step["out"]].each do |file_name|
          file_path = "#{stage_dag_json['output_dir_s3']}/#{pipeline_version}/#{file_name}"
          file_path_to_outputting_step[file_path] = { stageIndex: stage_index, stepIndex: step_index }
        end
      end
    end

    edges = []
    all_dag_jsons.each_with_index do |stage_dag_json, to_stage_index|
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

  def add_final_outputs_edges(stage_step_data, edge_data, all_dag_jsons)
    stage_step_data.each_with_index do |stage, stage_index|
      stage[:steps].each_with_index do |step, step_index|
        if step[:outputEdges].empty?
          dag_json = all_dag_jsons[stage_index]
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
