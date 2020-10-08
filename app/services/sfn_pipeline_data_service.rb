class SfnPipelineDataService
  include Callable
  # PipelineRunsHelper includes default descriptions, before we can get them from the dag
  include PipelineRunsHelper

  attr_reader :stage_names

  # Structures task definition of each stage of the pipeline run into the following in @results for drawing
  # the pipeline visualization graphs on the React side.
  # Also used by the results_folder endpoint on the samples controller.
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
  #     - variables: An array of variable objects with the following keys:
  #           - name: A string giving the name of the input variable
  #           - type: A string giving the variable's type
  #
  # status: The status of the pipeline.

  # Should be updated once async notifications are implemented
  # See https://jira.czi.team/browse/IDSEQ-2968

  WDL_PARSER = 'scripts/parse_wdl_workflow.py'.freeze
  WORKFLOW_INPUT_PREFIX = 'WorkflowInput'.freeze
  FILE_SOURCE_MAP_KEY = :unprefixed_name

  SFN_STEP_TO_DAG_STEP_NAME = {
    PipelineRunStage::HOST_FILTERING_STAGE_NAME => {
      "RunValidateInput" => "validate_input_out",
      "RunStar" => "star_out",
      "RunTrimmomatic" => "trimmomatic_out",
      "RunPriceSeq" => "priceseq_out",
      "RunCDHitDup" => "cdhitdup_out",
      "RunLZW" => "lzw_out",
      "RunBowtie2" => "bowtie2_out",
      "RunSubsample" => "subsampled_out",
      "RunGsnapFilter" => "gsnap_filter_out",
    },
    PipelineRunStage::ALIGNMENT_STAGE_NAME => {
      "RunAlignmentRemotely_gsnap_out" => "gsnap_out",
      "RunAlignmentRemotely_rapsearch2_out" => "rapsearch2_out",
      "CombineTaxonCounts" => "taxon_count_out",
      "GenerateAnnotatedFasta" => "annotated_out",
    },
    PipelineRunStage::POSTPROCESS_STAGE_NAME => {
      "RunAssembly" => "assembly_out",
      "GenerateCoverageStats" => "coverage_out",
      "DownloadAccessions_gsnap_accessions_out" => "gsnap_accessions_out",
      "DownloadAccessions_rapsearch2_accessions_out" => "rapsearch2_accessions_out",
      "BlastContigs_refined_gsnap_out" => "refined_gsnap_out",
      "BlastContigs_refined_rapsearch2_out" => "refined_rapsearch2_out",
      "CombineTaxonCounts" => "refined_taxon_count_out",
      "CombineJson" => "contig_summary_out",
      "GenerateAnnotatedFasta" => "refined_annotated_out",
      "GenerateTaxidFasta" => "refined_taxid_fasta_out",
      "GenerateTaxidLocator" => "refined_taxid_locator_out",
    },
    PipelineRunStage::EXPT_STAGE_NAME => {
      "GenerateTaxidFasta" => "taxid_fasta_out",
      "GenerateTaxidLocator" => "taxid_locator_out",
      "GenerateAlignmentViz" => "alignment_viz_out",
      "RunSRST2" => "srst2_out",
      "GenerateCoverageViz" => "coverage_viz_out",
      "NonhostFastq" => "nonhost_fastq_out",
    },
  }.freeze

  class ParseWdlError < StandardError
    def initialize(error)
      super("Command to parse wdl failed (#{WDL_PARSER}). Error: #{error}")
    end
  end

  def initialize(pipeline_run_id, see_experimental, remove_host_filtering_urls)
    @pipeline_run = PipelineRun.find(pipeline_run_id)

    # get the idseq-workflow s3 folder
    s3_folder = @pipeline_run.wdl_s3_folder

    @stage_names = []
    @stage_job_statuses = []
    @stages_wdl_info = []
    @host_filtering_stage_index = nil

    @pipeline_run.pipeline_run_stages.each_with_index do |stage, stage_index|
      if stage.name != PipelineRunStage::EXPT_STAGE_NAME || see_experimental
        @stage_names.push(stage.name)
        if stage.name == PipelineRunStage::HOST_FILTERING_STAGE_NAME
          @host_filtering_stage_index = stage_index
        end

        stage_wdl = retrieve_wdl(stage.dag_name, s3_folder)
        stage_info = parse_wdl(stage_wdl)
        @stages_wdl_info.push(stage_info)

        @stage_job_statuses.push(stage.job_status)
      end
    end

    # get results folder files
    @result_files = {}
    pr_file_array = @pipeline_run.sample.results_folder_files(@pipeline_run.pipeline_version)
    # store results folder files as a hash, with the display_name as the key
    pr_file_array.each do |f|
      @result_files[f[:display_name]] = {
        displayName: f[:display_name],
        url: f[:url],
        size: f[:size],
        key: f[:key],
      }
    end

    @remove_host_filtering_urls = remove_host_filtering_urls
    @see_experimental = see_experimental
  end

  def call
    stages = create_stage_nodes_scaffolding
    file_source_map = map_files_to_sources
    stages_with_output_files = add_output_files_to_steps(stages, file_source_map)
    file_source_map_with_destinations = map_files_to_output_steps(stages, file_source_map)
    edges = create_edges(file_source_map_with_destinations)
    if @remove_host_filtering_urls
      remove_host_filtering_urls(stages_with_output_files, edges)
    end
    populate_nodes_with_edges(stages_with_output_files, edges)
    data = { stages: stages_with_output_files, edges: edges, status: pipeline_job_status(stages) }
    return data
  end

  private

  def create_stage_nodes_scaffolding
    step_statuses_by_stage = @pipeline_run.step_statuses_by_stage

    stages = @stages_wdl_info.map.with_index do |stage_info, stage_index|
      stage_name = @stage_names[stage_index]
      step_statuses = step_statuses_by_stage[stage_index]
      step_descriptions = STEP_DESCRIPTIONS[stage_name]["steps"]

      all_redefined_statuses = []

      steps = stage_info["task_names"].map.with_index do |step, _step_index|
        # Get dag step name to retrieve step descriptions and status info.
        # Descriptions for steps may be in the PipelineRunsHelper module,
        # or in the status.json files on S3.
        dag_name = SFN_STEP_TO_DAG_STEP_NAME[stage_name][step]
        status_info = step_statuses[dag_name] || {}
        description = status_info["description"].presence || step_descriptions[dag_name]
        status = redefine_job_status(status_info["status"], @stage_job_statuses[stage_index])
        all_redefined_statuses << status

        # Retrieve variable and file information
        input_variables, input_files = retrieve_step_inputs(stage_info, step)

        {
          name: step,
          description: description || "",
          inputVariables: input_variables,
          inputFiles: input_files,
          outputFiles: [],
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

  def retrieve_step_inputs(stage_info, step)
    variables = []
    files = []
    step_inputs = stage_info["task_inputs"][step]
    step_inputs.each do |input|
      # add type information for input: variable (like string or int) or file
      # if type information is not in inputs, it's a file
      output_step, var_name = input.split(".")
      input_info = {
        name: var_name,
        type: "File",
      }

      if output_step == WORKFLOW_INPUT_PREFIX
        input_info[:type] = stage_info["inputs"][var_name]
      else
        input_info[:file] = File.basename(stage_info["basenames"][input])
      end

      case input_info[:type]
      when "File"
        files.push(input_info)
      else
        variables.push(input_info)
      end
    end
    return variables, files
  end

  # Unites the output files declared by the WDL workflow
  # with the result files found in sample.results_folder_files
  # and adds the stage and step index it came from
  def map_files_to_sources
    file_source_map = {}
    @stages_wdl_info.each_with_index do |stage_info, stage_index|
      output_file_map = collect_step_output_files(stage_info)
      stage_info["task_names"].each_with_index do |step, step_index|
        # Store indexing information for edge creation
        step_indexing_info = {
          stageIndex: stage_index,
          stepIndex: step_index,
        }

        output_files = output_file_map[step]
        output_files.each do |file|
          file[:from] = step_indexing_info
          file[:to] = []
          file[:data] = get_result_file_data(file[:file])
          file_source_map[file[FILE_SOURCE_MAP_KEY]] = file
        end
      end
    end
    return file_source_map
  end

  def collect_step_output_files(stage_info)
    output_file_map = Hash[stage_info["task_names"].collect { |task_name| [task_name, []] }]
    stage_info["outputs"].each do |output_var, wdl_reference|
      output_step, var_name = wdl_reference.split(".")
      output_info = {
        name: output_var,
        internal_name: var_name,
        unprefixed_name: unprefix(output_var),
        file: stage_info["basenames"][wdl_reference],
      }
      output_file_map[output_step].push(output_info)
    end
    return output_file_map
  end

  def add_output_files_to_steps(stage_nodes, file_source_map)
    file_source_map.each do |_key, file|
      if file[:from].present?
        stage_index, step_index = file[:from].values
        step = stage_nodes[stage_index][:steps][step_index]
        step[:outputFiles].push(file[:data])
      end
    end
    return stage_nodes
  end

  # This is just a workaround until we incorporate SFN execution history
  # and get a one-to-one mapping of outputs to inputs
  # See https://jira.czi.team/browse/IDSEQ-2967
  def unprefix(var_name)
    split_var = nil
    if var_name.include?("_out_")
      split_var = var_name.split("_out_")
    elsif var_name.include?("_in_")
      split_var = var_name.split("_in_")
    elsif var_name.include?("/")
      return File.basename(var_name)
    end

    if split_var.nil?
      return var_name
    end

    # gather every piece but the first
    return split_var.drop(1).join
  end

  def get_result_file_data(file)
    if @result_files.key?(file)
      return @result_files[file]
    elsif @result_files.key?(File.basename(file))
      return @result_files[File.basename(file)]
    else
      return {
        displayName: file,
        url: nil,
      }
    end
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
    if existing_stages_status == "finished" && @stages_wdl_info.length != (@see_experimental ? 4 : 3)
      return "inProgress"
    end

    return existing_stages_status
  end

  def map_files_to_output_steps(stage_nodes, file_source_map)
    stage_nodes.each_with_index do |stage, stage_index|
      steps = stage[:steps]
      steps.each_with_index do |step, step_index|
        # For each input file, we find the file in the file source map
        # and add the index of this step to its :to array.
        step[:inputFiles].each do |input_file|
          filename = input_file[:name]
          destination = { stageIndex: stage_index, stepIndex: step_index } # the current step
          file_map_key = find_file_map_key(filename, file_source_map)
          if file_map_key.nil?
            new_file_entry = {
              name: filename,
              data: { displayName: filename, url: nil },
              to: [destination],
            }
            file_source_map[filename] = new_file_entry
          else
            file_source_map[file_map_key][:to].push(destination)
          end
        end
        step.delete(:inputFiles)
      end
    end
    return file_source_map
  end

  # This can all be replaced, after we incorporate the SFN execution history,
  # with a one-to-one mapping of outputs to inputs.
  # See https://jira.czi.team/browse/IDSEQ-2967
  def find_file_map_key(filename, file_source_map)
    key = nil
    unprefixed_name = unprefix(filename)
    if file_source_map.key?(filename)
      key = filename
    elsif filename.include?("_out_") || filename.include?("_in_")
      if file_source_map.key?(unprefixed_name)
        key = unprefixed_name
      end
    end
    if key.nil?
      # time to dig deep...
      file_source_map.each_value do |file_info|
        [:name, :internal_name, :unprefixed_name].each do |symbol|
          other_name = file_info[symbol]
          if other_name == filename || other_name == unprefixed_name
            key = file_info[FILE_SOURCE_MAP_KEY]
            break
          end
        end
      end
    end
    return key
  end

  def create_edges(file_source_map)
    keyed_edges = {}

    file_source_map.each_value do |file_entry|
      file_data = file_entry[:data]
      # gather the edges it belongs in
      edges = []
      from = nil
      if file_entry.key?(:from)
        from = file_entry[:from]
      end
      if file_entry[:to].present?
        file_entry[:to].each do |to|
          new_edge = { to: to }
          if from.present?
            new_edge[:from] = from
          end
          edges.push(new_edge)
        end
      else
        edges = [{ from: from }]
      end
      # add to existing edge or create edge as needed
      edges.each do |edge|
        key = "#{edge[:from]}-#{edge[:to]}"
        if keyed_edges.key?(key)
          keyed_edges[key][:files].push(file_data)
        else
          edge[:files] = [file_data]
          keyed_edges[key] = edge
        end
      end
    end

    return keyed_edges.values
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
      # determine intrastage
      edge[:isIntraStage] = if from_stage_index && to_stage_index && from_stage_index == to_stage_index
                              true
                            else
                              false
                            end
    end
  end

  def remove_host_filtering_urls(stages, edges)
    # Removing host filtering URLs is important because the host filtering files
    #  may contain PGI. Removing the urls stops them from being downloadable.
    if @host_filtering_stage_index.present?
      stages[@host_filtering_stage_index][:steps].each do |step|
        step[:outputFiles].each do |file|
          file[:url] = nil
          file[:key] = nil
        end
      end
    end
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

  def retrieve_wdl(stage_dag_name, s3_folder)
    bucket, prefix = S3Util.parse_s3_path(s3_folder)
    key = "#{prefix}/#{stage_dag_name}.wdl"
    response = AwsClient[:s3].get_object(bucket: bucket,
                                         key: key)
    wdl = response.body.read
    return wdl
  end

  def parse_wdl(wdl)
    stdout, stderr, status = Open3.capture3(
      WDL_PARSER,
      stdin_data: wdl
    )
    unless status.success?
      raise ParseWdlError, stderr
    end

    parsed = JSON.parse(stdout)
    return parsed
  end
end
