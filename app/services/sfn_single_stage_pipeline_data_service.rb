class SfnSingleStagePipelineDataService
  include Callable
  include PipelineRunsHelper

  WDL_PARSER = 'scripts/parse_wdl_workflow.py'.freeze
  WORKFLOW_INPUT_PREFIX = 'WorkflowInput'.freeze
  FILE_SOURCE_MAP_KEY = :name

  ONT_STEP_DESCRIPTIONS = {
    "RunValidateInput" => "Validates input files are FASTQ format",
    "RunQualityFilter" => "Removes low quality bases, short reads, and low complexity reads",
    "RunHostFilter" => "Removes host reads",
    "RunHumanFilter" => "Removes human reads",
    "ReadLengthMetrics" => "Generates read length summary metrics",
    "RunSubsampling" => "Subsamples to 1 million reads",
    "PreAssemblyFasta" => "Converts subsampled read file from FASTQ to FASTA",
    "RunAssembly" => "Assembles subsampled, non-host reads using metaFlye",
    "RunReadsToContigs" => "Aligns reads back to contigs to identify reads associated with each contig and obtain non-contig reads",
    "GenerateContigStats" => "Generates a count of the number of reads/bases that map to each contig",
    "PrepareNTAlignmentInputs" => "Merges contigs and non-contig reads ahead of NT alignment",
    "RunNTAlignment" => "Aligns contigs and non-contig reads to the NCBI NT database using minimap2",
    "RunCallHitsNT" => "Assigns accessions from minimap2 to taxon IDs",
    "RunNRAlignment" => "Aligns contigs to the NCBI NR database using DIAMOND",
    "RunCallHitsNR" => "Assigns accessions from DIAMOND to taxon IDs",
    "FindTopHitsNT" => "Gets the top hit for each read and contig alignment against NT",
    "FindTopHitsNR" => "Gets the top hit for each contig alignment against NR",
    "SummarizeHitsNT" => "Generates a summary of all the reads aligning to NT, including those assembled into contigs",
    "SummarizeHitsNR" => "Generates a summary of reads assembled into contigs aligned to NR",
    "GenerateCoverageStats" => "Calculates coverage statistics for assembled contigs",
    "TallyHitsNT" => "Computes per-taxon statistics based on NT alignments",
    "UnmappedReads" => "Generates output containing unmapped reads",
    "TallyHitsNR" => "Computes per-taxon statistics based on NR alignments",
    "SummarizeContigsNT" => "Generates a summary of the NT contig alignments",
    "SummarizeContigsNR" => "Generates a summary of the NR contig alignments",
    "ComputeMergedTaxonCounts" => "Merges taxon results from NT and NR databases",
    "CombineTaxonCounts" => "Combines and merges taxon counts files from NT and NR databases",
    "CombineJson" => "Combines and merges contig summary files from NT and NR databases",
    "GenerateAnnotatedFasta" => "Annotates non-host FASTA with NCBI accession IDs",
    "GenerateTaxidLocator" => "Generates and annotates non-host .fasta with taxonomy IDs",
    "GenerateCoverageViz" => "Generates JSON files for coverage visualization to be consumed by the web app",
  }.freeze

  STEP_DESCRIPTIONS = {
    PipelineRun::TECHNOLOGY_INPUT[:nanopore] => ONT_STEP_DESCRIPTIONS,
  }.freeze

  PIPELINE_NAMES = {
    PipelineRun::TECHNOLOGY_INPUT[:nanopore] => "ONT mNGS Pipeline",
  }.freeze

  # Certain steps have access to "raw" data, i.e. data that has not been run through a human
  # filter yet. Note that these match keys in ONT_STEP_DESCRIPTIONS, which comes from "task_names"
  # from the underlying @wdl_info of the workflow. Depending on authZ, we need to prevent access
  # to the any files associated with these steps: see `remove_host_filtering_urls` boolean var.
  PRE_FILTERED_STEPS = [
    "RunValidateInput",
    "RunQualityFilter",
    "RunHostFilter",
    "RunHumanFilter",
  ].freeze

  class ParseWdlError < StandardError
    def initialize(error)
      super("Command to parse wdl failed (#{WDL_PARSER}). Error: #{error}")
    end
  end

  # TODO: [Vince] Should remove default for remove_host_filtering_urls once set up
  def initialize(id, analysis_type, remove_host_filtering_urls = false)
    # TODO: Update name to WorkflowRun when the PipelineRun model is deprecated
    # An analysis run can be either a PipelineRun or a WorkflowRun.
    set_analysis_run(id, analysis_type)
    @analysis_type = analysis_type
    # Do we need to prevent access to downloading "raw" data, i.e. non-host-filtered files?
    @remove_host_filtering_urls = remove_host_filtering_urls

    # Get the WDL workflow from the idseq-workflows S3 bucket and parse it with WDL parser found at script/parse_wdl_workflow.py
    s3_folder = @analysis_run.wdl_s3_folder
    raw_wdl = retrieve_wdl(s3_folder)
    @wdl_info = parse_wdl(raw_wdl)

    # get results folder files
    @result_files = {}
    pr_file_array = @analysis_run.sample.results_folder_files(@analysis_run.pipeline_version)

    # store results folder files as a hash, with the display_name as the key
    pr_file_array.each do |f|
      @result_files[f[:display_name]] = {
        displayName: f[:display_name],
        url: f[:url],
        size: f[:size],
        key: f[:key],
      }
    end
  end

  def call
    steps, pipeline_status = create_step_structure
    file_source_map = map_output_files_to_sources

    steps_with_output_files = add_output_files_to_steps(steps, file_source_map)
    # the below is needed for the pipeline viz
    file_source_map_with_destinations = map_files_to_output_steps(steps, file_source_map)
    edges = create_edges(file_source_map_with_destinations)
    populate_nodes_with_edges(steps_with_output_files, edges)

    # The single stage pipelines don't have PipelineRunStages, but the PipelineViz expects stages - so this is a workaround
    # to make the pipeline viz appear
    single_stage = { name: PIPELINE_NAMES[@analysis_type], steps: steps_with_output_files, jobStatus: pipeline_status }
    data = { stages: [single_stage], edges: edges, status: pipeline_status }
    return data
  end

  def create_step_structure
    step_statuses = single_stage_pipeline_step_statuses
    step_statuses = update_step_keys(step_statuses)
    step_descriptions = STEP_DESCRIPTIONS[@analysis_type]
    all_redefined_statuses = []

    steps = @wdl_info["task_names"].map do |step_name|
      status_info = step_statuses[step_name] || {}
      step_description = status_info["description"].presence || step_descriptions[step_name]
      status = redefine_job_status(status_info["status"])
      all_redefined_statuses << status

      # Retrieve variable and file information
      input_variables, input_files = retrieve_step_inputs(step_name)
      {
        name: step_name,
        description: step_description || "",
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

    pipeline_status = pipeline_job_status(all_redefined_statuses)
    [steps, pipeline_status]
  end

  def pipeline_job_status(statuses)
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
    else
      return "inProgress"
    end
  end

  # This is only temporary until the pipeline updates these keys to match the task names in the WDL
  def update_step_keys(step_statuses)
    # Need to update the keys to match the task names in the WDL
    if @analysis_type == PipelineRun::TECHNOLOGY_INPUT[:nanopore]
      step_statuses["CombineTaxonCounts"] = step_statuses.delete("refined_taxon_count_out") if step_statuses.key?("refined_taxon_count_out")
      step_statuses["CombineJson"] = step_statuses.delete("contig_summary_out") if step_statuses.key?("contig_summary_out")
      step_statuses["GenerateTaxidLocator"] = step_statuses.delete("refined_taxid_locator_out") if step_statuses.key?("refined_taxid_locator_out")
      step_statuses["GenerateCoverageViz"] = step_statuses.delete("coverage_viz_out") if step_statuses.key?("coverage_viz_out")
    end

    step_statuses
  end

  def redefine_job_status(step_status)
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
      # Should be errored if pipeline_run or workflow run is killed and the step_status file isn't updated.
      analysis_run_status == WorkflowRun::STATUS[:failed] ? "pipelineErrored" : "inProgress"
      "inProgress"
    end
  end

  def analysis_run_status
    if @analysis_type == PipelineRun::TECHNOLOGY_INPUT[:nanopore]
      @analysis_run.job_status
    else
      @analysis_run.status
    end
  end

  # Unites the output files declared by the WDL workflow
  # with the result files found in sample.results_folder_files
  def map_output_files_to_sources
    file_source_map = {}
    output_file_map = collect_step_output_files

    @wdl_info["task_names"].each_with_index do |step, step_index|
      output_files = output_file_map[step]

      output_files.each do |file|
        file[:from] = {
          # This will always be 0 because the ONT pipeline only has one stage
          stageIndex: 0,
          stepIndex: step_index,
        }
        file[:to] = []
        file[:data] = get_result_file_data(file[:file])
        # Redact download URLs when we should not have access to the "raw", unfiltered files
        if @remove_host_filtering_urls && PRE_FILTERED_STEPS.include?(step)
          file[:data][:url] = nil
        end
        file_source_map[file[FILE_SOURCE_MAP_KEY]] = file
      end
    end
    return file_source_map
  end

  def add_output_files_to_steps(steps, file_source_map)
    file_source_map.each do |_key, file|
      if file[:from].present?
        step_index = file[:from][:stepIndex]
        step = steps[step_index]
        step[:outputFiles].push(file[:data])
      end
    end
    return steps
  end

  def map_files_to_output_steps(steps, file_source_map)
    steps.each_with_index do |step, step_index|
      # For each input file, we find the file in the file source map
      # and add the index of this step to its :to array.
      step[:inputFiles].each do |input_file|
        filename = input_file[:name]
        destination = { stageIndex: 0, stepIndex: step_index }
        file_map_key = find_file_map_key(filename, file_source_map)
        if file_map_key.nil?
          new_file_entry = {
            name: filename,
            data: { displayName: filename, url: nil },
            to: [destination], # the current step
          }
          file_source_map[filename] = new_file_entry
        else
          file_source_map[file_map_key][:to].push(destination)
        end
      end
      step.delete(:inputFiles)
    end
    return file_source_map
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

  def populate_nodes_with_edges(steps_with_nodes, edges)
    edges.each_with_index do |edge, edge_index|
      if edge[:from]
        from_step_index = edge[:from][:stepIndex]
        steps_with_nodes[from_step_index][:outputEdges].push(edge_index)
      end
      if edge[:to]
        to_step_index = edge[:to][:stepIndex]
        steps_with_nodes[to_step_index][:inputEdges].push(edge_index)
      end

      # all edges are intra-stage because there's only one stage
      # the reason this is needed is because the original pipeline viz has multiple stages
      edge[:isIntraStage] = true if edge[:to].present? && edge[:from].present?
    end
  end

  def find_file_map_key(filename, file_source_map)
    key = nil
    if file_source_map.key?(filename)
      key = filename
    elsif filename.include?("_out_") || filename.include?("_in_")
      if file_source_map.key?(filename)
        key = filename
      end
    end
    if key.nil?
      # time to dig deep...
      file_source_map.each_value do |file_info|
        [:name, :internal_name].each do |symbol|
          other_name = file_info[symbol]
          if other_name == filename
            key = file_info[FILE_SOURCE_MAP_KEY]
            break
          end
        end
      end
    end
    return key
  end

  # Collect the output files of each task/step in the workflow from the basenames property in the parsed WDL
  def collect_step_output_files
    output_file_map = Hash[@wdl_info["task_names"].collect { |task_name| [task_name, []] }] # rubocop:disable Rails/IndexWith
    @wdl_info["basenames"].each do |wdl_reference, raw_output_filename|
      task_name, output_var_name = wdl_reference.split(".")
      output_info = {
        name: output_var_name,
        internal_name: output_var_name,
        file: raw_output_filename,
      }
      output_file_map[task_name].push(output_info)
    end
    return output_file_map
  end

  def retrieve_step_inputs(step)
    variables = []
    files = []
    step_inputs = @wdl_info["task_inputs"][step]
    step_inputs.each do |input|
      # add type information for input: variable (like string or int) or file
      # if type information is not in inputs, it's a file
      output_step, var_name = input.split(".")
      input_info = {
        name: var_name,
        type: "File",
      }

      if output_step == WORKFLOW_INPUT_PREFIX
        input_info[:type] = @wdl_info["inputs"][var_name]
      else
        input_info[:file] = File.basename(@wdl_info["basenames"][input])
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

  def retrieve_wdl(s3_folder)
    bucket, prefix = S3Util.parse_s3_path(s3_folder)
    key = "#{prefix}/run.wdl"
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

  # Fetches the status2.json file from S3 and parses it.
  # The status2.json file is outputted by the pipeline and contains information about the status of each step.
  # e.g. "RunValidateInput"=>{"status"=>"uploaded", "start_time"=>"1670355490.1407864", "end_time"=>"1670355519.6279788" (this is just one key/value pair)
  def single_stage_pipeline_step_statuses
    status_file_paths = {
      PipelineRun::TECHNOLOGY_INPUT[:nanopore] => "long_read_mngs_status2.json",
      # TODO: Add CG, AMR, and PhyloTree paths in the future since they're all single stage pipelines.
    }

    step_status_s3_file_path = "#{@analysis_run.sfn_results_path}/#{status_file_paths[@analysis_type]}"
    step_status_json = S3Util.get_s3_file(step_status_s3_file_path)

    if step_status_json
      begin
        return JSON.parse(step_status_json || "{}")
      rescue JSON::ParserError
        return {}
      end
    end
    {}
  end

  def set_analysis_run(id, analysis_type)
    @analysis_run = case analysis_type
                    when PipelineRun::TECHNOLOGY_INPUT[:nanopore]
                      PipelineRun.find(id)
                    else
                      WorkflowRun.find(id)
                    end
  end
end
