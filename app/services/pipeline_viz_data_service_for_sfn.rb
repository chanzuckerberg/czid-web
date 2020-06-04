class PipelineVizDataServiceForSfn
  include Callable
  # PipelineRunsHelper includes default descriptions, before we can get them from the dag
  include PipelineRunsHelper
  include PipelineOutputsHelper

  # Structures task definition of each stage of the pipeline run into the following in @results for drawing
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

  # Should be updated once async notifications are implemented

  # s3 folder for sfn results: pipeline_run.sfn_results_path

  WDL_PARSER = 'scripts/parse_wdl_workflow.py'.freeze
  SFN_CLIENT = Aws::States::Client.new

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

    # get proper s3 folder
    wdl_version = @pipeline_run.wdl_version
    s3_folder = get_wdl_s3_folder(wdl_version)
    # sample_path = @pipeline_run.sample.sample_path
    # old_s3_folder = "s3://#{ENV['SAMPLES_BUCKET_NAME']}/#{sample_path}/sfn-wdl"

    @stage_names = []
    @stage_job_statuses = []
    @all_stage_info = []

    @pipeline_run.pipeline_run_stages.each do |stage|
      if stage.name != PipelineRunStage::EXPT_STAGE_NAME || see_experimental
        @stage_names.push(stage.name)

        stage_wdl = retrieve_wdl(stage.dag_name, s3_folder)
        stage_info = parse_wdl(stage_wdl)
        @all_stage_info.push(stage_info)

        @stage_job_statuses.push(stage.job_status)
      end
    end

    # get results folder files
    @result_files = {}
    pr_file_array = @pipeline_run.sample.results_folder_files(@pipeline_run.pipeline_version)
    # store results folder files as a hash, with the display_name as the key
    pr_file_array.each do |f|
      display_name = f[:display_name]
      url = f[:url]
      @result_files[display_name] = {
        displayName: display_name,
        url: url,
      }
    end

    @file_basenames = {}
    @all_stage_info.each { |stage| @file_basenames.merge!(stage['basenames']) }

    @remove_host_filtering_urls = remove_host_filtering_urls
    @see_experimental = see_experimental
  end

  def call
    stages = create_stage_nodes_scaffolding
    edges = create_edges
    if @remove_host_filtering_urls
      remove_host_filtering_urls(edges)
    end
    populate_nodes_with_edges(stages, edges)

    return { stages: stages, edges: edges, status: pipeline_job_status(stages) }
  end

  private

  def get_wdl_s3_folder(wdl_version)
    "s3://idseq-workflows/v#{wdl_version}/main"
  end

  def create_stage_nodes_scaffolding
    all_step_statuses = @pipeline_run.step_statuses_by_stage

    stages = @all_stage_info.map.with_index do |stage_info, stage_index|
      stage_name = @stage_names[stage_index]
      step_statuses = all_step_statuses[stage_index]
      step_descriptions = STEP_DESCRIPTIONS[stage_name]["steps"]

      all_redefined_statuses = []

      steps = stage_info["step_names"].map do |step|
        # Get dag step name to retrieve step descriptions and status info.
        # Descriptions for steps may be in the PipelineRunsHelper module,
        # or in the status.json files on S3.
        dag_name = SFN_STEP_TO_DAG_STEP_NAME[stage_name][step]
        status_info = step_statuses[dag_name] || {}
        description = status_info["description"].blank? ? step_descriptions[dag_name] : status_info["description"]

        status = redefine_job_status(status_info["status"], @stage_job_statuses[stage_index])
        all_redefined_statuses.push(status)

        {
          name: step,
          description: description || "",
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
    if existing_stages_status == "finished" && @all_stage_info.length != (@see_experimental ? 4 : 3)
      return "inProgress"
    end
    return existing_stages_status
  end

  # edges: An array of edges, each edge object having the following structure:
  #     - from: An object containing a stageIndex and stepIndex, denoting the originating node it is from
  #     - to: An object containing a stageIndex and stepIndex, denoating the node it ends after
  #     - files: An array of file objects that get passed between the from and to nodes. It is composed of:
  #           - displayName: A string to display the file as
  #           - url: An optional string to download the file
  # -------------------------------------------------------------------------------------------------------
  # stage = { 'inputs': stage_inputs, 'step_names': step_names, 'steps': steps, 'basenames': file_basenames, 'outputs': outputs }
  def create_edges
    all_edges = {}

    # file_mapping = create_file_mapping
    step_mapping = create_step_mapping

    # helper dict for storing output aliases
    aliases = {}
    all_outputs = {}
    outputs_processed = {}
    @all_stage_info.each_with_index do |stage, stage_index|
      stage['steps'].each do |step, inputs|
        stage_edges = []
        inputs.each do |input|
          input_edge = create_input_edge(input, step, stage_index, aliases)
          stage_edges.push(input_edge)
          outputs_processed[input] = true
        end
        # merge edges
        merge_edges(stage_edges, all_edges, step_mapping)
      end
      # map outputs
      stage['outputs'].each do |output_alias, source|
        # map aliases
        aliases[output_alias] = { original: source, stage: stage_index }
        if output_alias.include?("_out_")
          consistent_suffix = output_alias.split("_out_")[1].sub(/assembly_/, "")
          aliases[consistent_suffix] = { original: source, stage: stage_index }
        end
        # tally up outputs
        all_outputs[source] = stage_index
      end
    end

    # create edges for outputs that don't connect to another step
    all_outputs.each do |source, stage_index|
      if outputs_processed.key?(source)
        next
      else
        output_edge = create_output_edge(source, stage_index, step_mapping)
        from_stage_index = output_edge[:from][:stageIndex]
        from_step_index = output_edge[:from][:stepIndex]
        key = "from_#{from_stage_index}_#{from_step_index}"
        if all_edges.key?(key)
          all_edges[key][:files].concat(output_edge[:files])
        else
          all_edges[key] = output_edge
        end
      end
    end

    return all_edges.values
  end

  def create_input_edge(input, step, stage_index, aliases)
    # check the output step
    output_step, file = input.split(".")
    from_stage_index = stage_index
    if output_step == "StageInput"
      source = interstage_output_source(file, aliases)
      if source.present?
        output_step, file = source[:original].split(".")
        from_stage_index = source[:stage]
      end
    end
    # get file data
    actual_input = "#{output_step}.#{file}"
    file_data = get_result_file_data(actual_input)
    # create the edge
    return {
      from: "#{from_stage_index}.#{output_step}",
      to: "#{stage_index}.#{step}",
      file: file_data,
    }
  end

  def merge_edges(stage_edges, all_edges, step_mapping)
    stage_edges.each do |edge|
      from = edge[:from].include?("StageInput") ? nil : step_mapping[edge[:from]]
      to = step_mapping[edge[:to]]
      key_prefix = from.nil? ? "" : "from_#{from[:stageIndex]}_#{from[:stepIndex]}"
      key = "#{key_prefix}_to_#{to[:stageIndex]}_#{to[:stepIndex]}"
      if all_edges.key?(key)
        all_edges[key][:files].push(edge[:file])
      else
        all_edges[key] = {
          to: to,
          files: [edge[:file]],
        }
        if from.present?
          all_edges[key][:from] = from
        end
      end
    end
  end

  def create_output_edge(source, stage_index, step_mapping)
    output_step, _file = source.split(".")
    # get file data
    file_data = get_result_file_data(source)

    return {
      from: step_mapping["#{stage_index}.#{output_step}"],
      files: [file_data],
    }
  end

  def interstage_output_source(file, aliases)
    source = nil
    if aliases.key?(file)
      source = aliases[file]
    elsif file.include?("_out_") && aliases[file.split("_out_")[1]].present?
      source = aliases[file.split("_out_")[1]]
    elsif file.include?("_in_") && aliases[file.split("_in_")[1]].present?
      source = aliases[file.split("_in_")[1]]
    end
    return source
  end

  def get_result_file_data(input)
    file_data = nil
    basenames = @file_basenames
    assembly_sub_regex = Regexp.new('assembly/')
    input_basename = basenames.key?(input) ? basenames[input].sub(assembly_sub_regex, "") : nil
    output_step, file = input.split(".")
    if input_basename && @result_files.key?(input_basename)
      file_data = @result_files[input_basename]
    elsif @result_files.key?("#{output_step}.#{file}")
      file_data = @result_files["#{output_step}.#{file}"]
    else
      key = input_basename || file
      @result_files[key] = {
        displayName: key,
        url: nil,
      }
      file_data = @result_files[key]
    end
    return file_data
  end

  # Map step names to a stage index and step index
  def create_step_mapping
    step_map = {}
    @all_stage_info.each_with_index do |stage, stage_index|
      stage['step_names'].each_with_index do |step, step_index|
        step_map["#{stage_index}.#{step}"] = {
          stageIndex: stage_index,
          stepIndex: step_index,
        }
      end
    end
    return step_map
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

  def retrieve_wdl(stage_dag_name, s3_folder)
    bucket, prefix = S3Util.parse_s3_path(s3_folder)
    key = "#{prefix}/#{stage_dag_name}.wdl"
    response = S3_CLIENT.get_object(bucket: bucket,
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
