class SfnOntPipelineDataService
  # ONT mNGS pipeline runs don't have PipelineRunStages like the short-read-mngs pipeline
  # This service is only for ONT mNGS pipeline runs

  include Callable
  include PipelineRunsHelper

  WDL_PARSER = 'scripts/parse_wdl_workflow.py'.freeze
  WORKFLOW_INPUT_PREFIX = 'WorkflowInput'.freeze
  FILE_SOURCE_MAP_KEY = :unprefixed_name

  ONT_STEP_DESCRIPTIONS = {
    "RunValidateInput" => "this is a step description",
    "RunQualityFilter" => "this is a step description",
    "RunHostFilter" => "this is a step description",
    "RunHumanFilter" => "this is a step description",
    "RunSubsampling" => "this is a step description",
    "PreAssemblyFasta" => "this is a step description",
    "RunAssembly" => "this is a step description",
    "RunReadsToContigs" => "this is a step description",
    "GenerateContigStats" => "this is a step description",
    "PrepareNTAlignmentInputs" => "this is a step description",
    "RunNTAlignment" => "this is a step description",
    "RunCallHitsNT" => "this is a step description",
    "RunNRAlignment" => "this is a step description",
    "RunCallHitsNR" => "this is a step description",
    "FindTopHitsNT" => "this is a step description",
    "FindTopHitsNR" => "this is a step description",
    "SummarizeHitsNT" => "this is a step description",
    "SummarizeHitsNR" => "this is a step description",
    "GenerateCoverageStats" => "this is a step description",
    "TallyHitsNT" => "this is a step description",
    "UnmappedReads" => "this is a step description",
    "TallyHitsNR" => "this is a step description",
    "ReassignM8NT" => "this is a step description",
    "ReassignM8NR" => "this is a step description",
    "SummarizeContigsNT" => "this is a step description",
    "SummarizeContigsNR" => "this is a step description",
    "ComputeMergedTaxonCounts" => "this is a step description",
    "CombineTaxonCounts" => "this is a step description",
    "CombineJson" => "this is a step description",
    "GenerateAnnotatedFasta" => "this is a step description",
    "GenerateTaxidFasta" => "this is a step description",
    "GenerateTaxidLocator" => "this is a step description",
    "GenerateCoverageViz" => "this is a step description",
  }.freeze

  class ParseWdlError < StandardError
    def initialize(error)
      super("Command to parse wdl failed (#{WDL_PARSER}). Error: #{error}")
    end
  end

  def initialize(pipeline_run_id)
    @pipeline_run = PipelineRun.find(pipeline_run_id)

    # Get the WDL workflow from the idseq-workflows S3 bucket and parse it with WDL parser found at script/parse_wdl_workflow.py
    s3_folder = @pipeline_run.wdl_s3_folder
    ont_wdl = retrieve_wdl(s3_folder)
    @ont_info = parse_wdl(ont_wdl)

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
  end

  def call
    steps = create_step_structure
    file_source_map = map_output_files_to_sources

    steps_with_output_files = add_output_files_to_steps(steps, file_source_map)
    # the below is needed for the pipeline viz
    file_source_map_with_destinations = map_files_to_output_steps(steps, file_source_map)
    edges = create_edges(file_source_map_with_destinations)
    populate_nodes_with_edges(steps_with_output_files, edges)

    # The ONT mngs pipeline doesn't have PipelineRunStages, but the PipelineViz expects stages - so this is a workaround
    # to make the pipeline viz appear
    single_stage = { name: "ONT mNGS Pipeline", steps: steps_with_output_files, jobStatus: "finished" }
    data = { stages: [single_stage], edges: edges, status: "finished" }
    return data
  end

  def create_step_structure
    steps = @ont_info["task_names"].map.with_index do |step, _step_index|
      step_description = ONT_STEP_DESCRIPTIONS[step]
      # Retrieve variable and file information
      input_variables, input_files = retrieve_step_inputs(step)
      {
        name: step,
        description: step_description || "",
        inputVariables: input_variables,
        inputFiles: input_files,
        status: "finished",
        outputFiles: [],
        inputEdges: [],
        outputEdges: [],
      }
    end
    steps
  end

  # Unites the output files declared by the WDL workflow
  # with the result files found in sample.results_folder_files
  def map_output_files_to_sources
    file_source_map = {}
    output_file_map = collect_step_output_files

    @ont_info["task_names"].each_with_index do |step, step_index|
      output_files = output_file_map[step]

      output_files.each do |file|
        file[:from] = {
          stageIndex: 0,
          stepIndex: step_index,
        }
        file[:to] = []
        file[:data] = get_result_file_data(file[:file])
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
        edge[:isIntraStage] = true
      end
    end
  end

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

  # Collect the output files of each task/step in the workflow from the basenames property in the parsed WDL
  def collect_step_output_files
    output_file_map = Hash[@ont_info["task_names"].collect { |task_name| [task_name, []] }] # rubocop:disable Rails/IndexWith
    @ont_info["basenames"].each do |wdl_reference, raw_output_filename|
      task_name, output_var_name = wdl_reference.split(".")
      output_info = {
        name: output_var_name,
        internal_name: output_var_name,
        unprefixed_name: unprefix(output_var_name),
        file: raw_output_filename,
      }
      output_file_map[task_name].push(output_info)
    end
    return output_file_map
  end

  def retrieve_step_inputs(step)
    variables = []
    files = []
    step_inputs = @ont_info["task_inputs"][step]
    step_inputs.each do |input|
      # add type information for input: variable (like string or int) or file
      # if type information is not in inputs, it's a file
      output_step, var_name = input.split(".")
      input_info = {
        name: var_name,
        type: "File",
      }

      if output_step == WORKFLOW_INPUT_PREFIX
        input_info[:type] = @ont_info["inputs"][var_name]
      else
        input_info[:file] = File.basename(@ont_info["basenames"][input])
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
end
