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

  WDL_PARSER = 'app/jobs/parse_wdl_workflow.py'.freeze

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
    s3_folder = @pipeline_run.sample.sample_wdl_s3_path
    @stage_names = []
    @stage_job_statuses = []
    @all_stage_info = []

    @pipeline_run.pipeline_run_stages.each do |stage|
      if stage.name != PipelineRunStage::EXPT_STAGE_NAME || see_experimental
        @stage_names.push(stage.name)
        stage_info = {}
        if stage.step_map.nil? || stage.step_map.blank?
          stage_wdl = retrieve_wdl(stage.dag_name, s3_folder)
          stage_info = parse_wdl(stage_wdl)
        else
          stage_info = JSON.parse(stage.step_map)
        end
        @all_stage_info.push(stage_info)
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
    all_step_statuses = @pipeline_run.step_statuses_by_stage

    stages = @all_stage_info.map.with_index do |stage_info, stage_index|
      stage_name = @stage_names[stage_index]
      step_statuses = all_step_statuses[stage_index]
      step_descriptions = STEP_DESCRIPTIONS[stage_name]["steps"]

      all_redefined_statuses = []

      steps = stage_info["steps"].map do |step|
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
  def create_edges
    all_edges = {}

    pr_files = {}
    pr_file_array = @pipeline_run.sample.results_folder_files(@pipeline_run.pipeline_version)
    # store results folder files as a hash, with the display_name as the key
    pr_file_array.each { |f| pr_files[f[:display_name]] = f }

    file_mapping = create_file_mapping
    step_mapping = create_step_mapping

    # do the thing
    file_mapping.each do |file, filemap|
      file_edges = []
      from = nil
      key = nil

      display_name = file
      url = nil
      if filemap[:filename].present?
        result_file_info = pr_files[filemap[:filename]]
        if result_file_info.present?
          display_name = result_file_info[:display_name]
          url = result_file_info[:url]
        end
      end
      # all the edges for the file will have the same from
      if filemap[:from].present? && step_mapping[filemap[:from]].present?
        from = step_mapping[filemap[:from]]
        key = "from_#{from[:stageIndex]}_#{from[:stepIndex]}"
      end
      # how many edges we create depends on the number of inputs the
      # file is used as. Steps are in the :to key.
      # if this file isn't an input to anything, just return one edge
      if filemap[:to].empty?
        file_edges.push(from: from,
                        key: key,
                        files: [{ displayName: display_name, url: url }])
      else
        filemap[:to].each do |dest_step_name|
          to = step_mapping[dest_step_name]
          to_key = "_to_#{to[:stageIndex]}_#{to[:stepIndex]}"
          push_key = key ? key + to_key : to_key
          file_edges.push(from: from,
                          to: to,
                          key: push_key,
                          files: [{ displayName: display_name, url: url }])
        end
      end
      # now we integrate the edges into our collection
      file_edges.each do |edge|
        edge_key = edge[:key]
        if all_edges[edge_key]
          all_edges[edge_key][:files].concat(edge[:files])
        else
          all_edges[edge_key] = edge
        end
      end
    end

    # filter edges that aren't complete connections
    # return all_edges.values.select { |edge| edge[:from].present? && edge[:to].present? }
    return all_edges.values
  end

  # Map step names to a stage index and step index
  def create_step_mapping
    step_map = {}
    @all_stage_info.each_with_index do |stage, stage_index|
      stage['steps'].each_with_index do |step, step_index|
        step_map[step] = {
          stageIndex: stage_index,
          stepIndex: step_index,
        }
      end
    end
    return step_map
  end

  # Collect information on all inputs and outputs
  def create_file_mapping
    files = {}
    @all_stage_info.each_with_index do |stage, stage_index|
      stage_files = stage['files']
      stage_files.each do |file, info|
        file_key = file
        var_name = info['var_name']
        from = info['output_from'] || ""
        to = info['input_to'] || []
        filename = info['filename'] || ""

        # check for file aliases
        if from.blank? || from == 'StageInput'
          search_alias = find_file_alias(var_name, stage_index)
          if search_alias.present?
            file_key = search_alias
          end
        end

        if files.key?(file_key)
          files[file_key][:to] = files[file_key][:to].concat(to)
        else
          files[file_key] = {
            from: from,
            to: to,
            filename: filename,
          }
        end
      end
    end
    return files
  end

  def find_file_alias(file_var, stage_index)
    if stage_index == 0
      return ""
    end
    previous_stage = stage_index - 1
    search_key = file_var
    # check if this file variable appears in previous outputs
    other_alias = alias_search(search_key, previous_stage)
    if other_alias.present?
      return other_alias
    end
    # sometimes prefixes are appended to the file variables,
    # like host_filter_out_ or taxid_fasta_in_
    if search_key.include?("_in_")
      search_key = search_key.partition("_in_")[2] # get the tail
    elsif search_key.include?("_out_")
      search_key = search_key.partition("_out_")[2]
    end
    # one last try
    if search_key != file_var
    end
    return suffix_search(search_key, previous_stage)
  end

  def alias_search(search_key, previous_stage)
    # first check if it appears renamed in a stage output
    previous_stage.downto(0) do |i|
      prior_outputs = @all_stage_info[i]['outputs']
      if prior_outputs.key?(search_key)
        return prior_outputs[search_key]
      end
    end
    return ""
  end

  def suffix_search(search_key, previous_stage)
    # then check if it appears in a previous stage's files
    previous_stage.downto(0) do |i|
      prior_files = @all_stage_info[i]['files']
      prior_files.each do |file_key, file_info|
        # some files actually refer to assembly files
        possible_aliases = [file_info['var_name'], file_info['var_name'].partition("assembly_")[2]]
        if possible_aliases.include?(search_key)
          return file_key
        end
      end
    end
    return "" # ~~ it is a mystery ~~
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
      edge[:isIntraStage] = if from_stage_index && to_stage_index && from_stage_index != to_stage_index
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
    stdout, _stderr, status = Open3.capture3(
      WDL_PARSER,
      stdin_data: wdl
    )
    unless status.success?
      raise ParseWdlError
    end
    parsed = JSON.parse(stdout)
    return parsed
  end
end
