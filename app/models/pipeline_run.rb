require 'open3'
require 'json'
class PipelineRun < ApplicationRecord
  include ApplicationHelper
  include PipelineOutputsHelper
  belongs_to :sample
  belongs_to :alignment_config
  has_many :pipeline_run_stages
  accepts_nested_attributes_for :pipeline_run_stages
  has_and_belongs_to_many :backgrounds

  has_many :output_states
  has_many :taxon_counts, dependent: :destroy
  has_many :job_stats, dependent: :destroy
  has_many :taxon_byteranges, dependent: :destroy
  has_many :ercc_counts, dependent: :destroy
  accepts_nested_attributes_for :taxon_counts
  accepts_nested_attributes_for :job_stats
  accepts_nested_attributes_for :taxon_byteranges
  accepts_nested_attributes_for :ercc_counts

  DEFAULT_SUBSAMPLING = 1_000_000 # number of fragments to subsample to, after host filtering
  MAX_INPUT_FRAGMENTS = 75_000_000 # max fragments going into the pipeline
  OUTPUT_JSON_NAME = 'taxon_counts.json'.freeze
  # VERSION_JSON_NAME = 'versions.json'.freeze # TODO: remove this line
  PIPELINE_VERSION_FILE = "pipeline_version.txt".freeze
  STATS_JSON_NAME = "stats.json".freeze
  ERCC_OUTPUT_NAME = 'reads_per_gene.star.tab'.freeze
  TAXID_BYTERANGE_JSON_NAME = 'taxid_locations_combined.json'.freeze
  ASSEMBLY_STATUSFILE = 'job-complete'.freeze
  LOCAL_JSON_PATH = '/app/tmp/results_json'.freeze
  PIPELINE_VERSION_WHEN_NULL = '1.0'.freeze

  # The PIPELINE MONITOR is responsible for keeping status of AWS Batch jobs
  # and for submitting jobs that need to be run next.
  # It accomplishes this using the following:
  #    function "update_job_status"
  #    columns "job_status", "finalized"
  #    records "pipeline_run_stages".
  # The progression for a pipeline_run_stage's job_status is as follows:
  # STARTED -> RUNNABLE -> RUNNING -> SUCCEEDED / FAILED (via aegea batch or status files).
  # Once a stage has finished, the next stage is kicked off.
  # A pipeline_run's job_status indicates the most recent stage the run was at,
  # as well as that stage's status. At the end of a successful run, the pipeline_run's
  # job_status is set to CHECKED. If a late stage failed (e.g. postprocessing), but the
  # main report is ready, these facts are indicated in the job_status using the suffix
  # "FAILED|READY". The column "finalized", if set to 1, indicates that the pipeline monitor
  # no longer needs to check on or update the pipeline_run's job_status.

  STATUS_CHECKED = 'CHECKED'.freeze
  STATUS_FAILED = 'FAILED'.freeze
  STATUS_RUNNING = 'RUNNING'.freeze
  STATUS_RUNNABLE = 'RUNNABLE'.freeze
  STATUS_READY = 'READY'.freeze

  # The RESULT MONITOR is responsible for keeping status of available outputs
  # and for loading those outputs in from S3.
  # It accomplishes this using the following:
  #    function "monitor_results"
  #    column "results_finalized"
  #    records "output_states"
  # The output_states indicate the state of each target output, the progression being as follows:
  # UNKNOWN -> LOADING_QUEUED -> LOADING -> LOADED / FAILED (see also state machine below).
  # When all results have been loaded, or the PIPELINE MONITOR indicates no new outputs will be
  # forthcoming (due to either success or failure), results_finalized is set to FINALIZED_SUCCESS
  # or FINALIZED_FAIL in order to indicate to the RESULT MONITOR that it can stop attending to the pipeline_run.
  # In the case of failure, we determine whether the main report is nevertheless ready
  # by checking whether REPORT_READY_OUTPUT has been loaded.
  # Note we don't put a default on results_finalized in the schema, so that we can
  # recognize old runs by results_finalized being nil.

  STATUS_LOADED = 'LOADED'.freeze
  STATUS_UNKNOWN = 'UNKNOWN'.freeze
  STATUS_LOADING = 'LOADING'.freeze
  STATUS_LOADING_QUEUED = 'LOADING_QUEUED'.freeze
  STATUS_LOADING_ERROR = 'LOADING_ERROR'.freeze

  LOADERS_BY_OUTPUT = { "ercc_counts" => "db_load_ercc_counts",
                        "taxon_counts" => "db_load_taxon_counts",
                        "taxon_byteranges" => "db_load_byteranges" }.freeze
  # Note: reads_before_priceseqfilter, reads_after_priceseqfilter, reads_after_cdhitdup
  #       are the only "job_stats" we actually need for web display.
  REPORT_READY_OUTPUT = "taxon_counts".freeze

  # Values for results_finalized are as follows.
  # Note we don't put a default on results_finalized in the schema, so that we can
  # recognize old runs by results_finalized being nil.

  IN_PROGRESS = 0
  FINALIZED_SUCCESS = 10
  FINALIZED_FAIL = 20

  # State machine for RESULT MONITOR:
  #
  #  +-----------+ !output_ready
  #  |           | && !pipeline_finalized
  #  |           | (RM)
  #  |     +-----+------+
  #  +-----> POLLING    +------------------------------+
  #        +-----+------+                              |
  #              |                                     |
  #              | output_ready?                       |
  #              | (RM)                                |
  #              |                                     |
  #        +-----v------+                              |    !output_ready?
  #        | QUEUED FOR |                              |    && pipeline_finalized
  #        | LOADING    |                              |    (RM)
  #        +-----+------+                              |
  #              |                                     |
  #              | (Resque)                            |
  #              |                                     |
  #        +-----v------+         !success?            |
  #        | LOADING    +------------+                 |
  #        +-----+------+            |                 |
  #              |                   |(Resque          |
  #              | success?          |  Worker)        |
  #              | (Resque worker)   |                 |
  #        +-----v------+            |            +----v---+
  #        | COMPLETED  |            +------------> FAILED |
  #        +------------+                         +--------+
  #
  #
  # (RM) transition executed by the Result Monitor
  # (Resque Worker) transition executed by the Resque Worker

  before_create :create_output_states, :create_run_stages

  def as_json(options = {})
    super(options.merge(except: [:command, :command_stdout, :command_error, :job_description]))
  end

  def check_box_label
    project_name = sample.project ? sample.project.name : 'Unknown Project'
    "#{project_name} : #{sample.name} (#{id})"
  end

  def archive_s3_path
    "s3://#{SAMPLES_BUCKET_NAME}/pipeline_runs/#{id}_sample#{sample.id}"
  end

  def self.in_progress
    where("job_status != '#{STATUS_FAILED}' OR job_status IS NULL")
      .where(finalized: 0)
  end

  def self.results_in_progress
    where(results_finalized: IN_PROGRESS)
  end

  def self.in_progress_at_stage_1_or_2
    in_progress.where("job_status NOT LIKE '3.%' AND job_status NOT LIKE '4.%'")
  end

  def self.top_completed_runs
    where("id in (select max(id) from pipeline_runs where job_status = 'CHECKED' and
                  sample_id in (select id from samples) group by sample_id)")
  end

  def finalized?
    finalized == 1
  end

  def results_finalized?
    [FINALIZED_SUCCESS, FINALIZED_FAIL].include?(results_finalized)
  end

  def failed?
    /FAILED/ =~ job_status || results_finalized == FINALIZED_FAIL
  end

  def create_output_states
    # First, determine which outputs we need:
    target_outputs = %w[ercc_counts taxon_counts taxon_byteranges]

    # Then, generate output_states
    output_state_entries = []
    target_outputs.each do |output|
      output_state_entries << OutputState.new(
        output: output,
        state: STATUS_UNKNOWN
      )
    end
    self.output_states = output_state_entries

    # Also initialize results_finalized here.
    self.results_finalized = IN_PROGRESS
  end

  def create_run_stages
    run_stages = []

    # Host Filtering
    run_stages << PipelineRunStage.new(
      step_number: 1,
      name: PipelineRunStage::HOST_FILTERING_STAGE_NAME,
      job_command_func: 'host_filtering_command'
    )

    # Alignment and Merging
    run_stages << PipelineRunStage.new(
      step_number: 2,
      name: PipelineRunStage::ALIGNMENT_STAGE_NAME,
      job_command_func: 'alignment_command'
    )

    # Taxon Fastas and Alignment Visualization
    run_stages << PipelineRunStage.new(
      step_number: 3,
      name: PipelineRunStage::POSTPROCESS_STAGE_NAME,
      job_command_func: 'postprocess_command'
    )

    self.pipeline_run_stages = run_stages
  end

  def completed?
    return true if finalized?
    # Old version before run stages
    return true if pipeline_run_stages.blank? && (job_status == STATUS_FAILED || job_status == STATUS_CHECKED)
  end

  def log_url
    return nil unless job_log_id
    "https://us-west-2.console.aws.amazon.com/cloudwatch/home?region=us-west-2" \
      "#logEventViewer:group=/aws/batch/job;stream=#{job_log_id}"
  end

  def active_stage
    pipeline_run_stages.order(:step_number).each do |prs|
      return prs unless prs.succeeded?
    end
    # If all stages have succeded:
    nil
  end

  def retry
    return unless failed? # only retry from a failed job
    prs = active_stage
    prs.job_status = nil
    prs.job_command = nil
    prs.db_load_status = 0
    prs.save
    self.finalized = 0
    self.results_finalized = IN_PROGRESS
    ouput_states.each { |o| o.update(state: STATUS_UNKNOWN) if o.state != STATUS_LOADED }
    save
  end

  def report_ready?
    output_states.find_by(output: REPORT_READY_OUTPUT).state == STATUS_LOADED
  end

  def succeeded?
    job_status == STATUS_CHECKED
  end

  def db_load_ercc_counts
    # TODO: remove the following. deprecated.
    # Load version info applicable to host filtering
    # version_s3_path = "#{host_filter_output_s3_path}/#{VERSION_JSON_NAME}"
    # self.version = `aws s3 cp #{version_s3_path} -`

    # Load ERCC counts
    ercc_s3_path = "#{host_filter_output_s3_path}/#{ERCC_OUTPUT_NAME}"
    _stdout, _stderr, status = Open3.capture3("aws", "s3", "ls", ercc_s3_path)
    return unless status.exitstatus.zero?
    ercc_lines = `aws s3 cp #{ercc_s3_path} - | grep 'ERCC' | cut -f1,2`
    ercc_counts_array = []
    ercc_lines.split(/\r?\n/).each do |line|
      fields = line.split("\t")
      name = fields[0]
      count = fields[1].to_i
      ercc_counts_array << { name: name, count: count }
    end
    update(ercc_counts_attributes: ercc_counts_array)
    update(total_ercc_reads: ercc_counts_array.map { |entry| entry[:count] }.sum)
  end

  def taxon_counts_json_name
    OUTPUT_JSON_NAME
  end

  def invalid_family_call?(tcnt)
    # TODO:  Better family support.
    tcnt['family_taxid'].to_i < TaxonLineage::INVALID_CALL_BASE_ID
  rescue
    false
  end

  def db_load_taxon_counts
    output_json_s3_path = "#{alignment_output_s3_path}/#{taxon_counts_json_name}"
    downloaded_json_path = PipelineRun.download_file_with_retries(output_json_s3_path,
                                                                  local_json_path, 3)
    Airbrake.notify("PipelineRun #{id} failed taxon_counts download") unless downloaded_json_path
    return unless downloaded_json_path

    json_dict = JSON.parse(File.read(downloaded_json_path))
    pipeline_output_dict = json_dict['pipeline_output']
    pipeline_output_dict.slice!('taxon_counts_attributes')

    # TODO: remove the following. deprecated.
    # version_s3_path = "#{alignment_output_s3_path}/#{VERSION_JSON_NAME}"
    # update(version: `aws s3 cp #{version_s3_path} -`)

    # only keep counts at certain taxonomic levels
    taxon_counts_attributes_filtered = []
    acceptable_tax_levels = [TaxonCount::TAX_LEVEL_SPECIES]
    acceptable_tax_levels << TaxonCount::TAX_LEVEL_GENUS if multihit?
    acceptable_tax_levels << TaxonCount::TAX_LEVEL_FAMILY if multihit?
    pipeline_output_dict['taxon_counts_attributes'].each do |tcnt|
      # TODO:  Better family support.
      if acceptable_tax_levels.include?(tcnt['tax_level'].to_i) && !invalid_family_call?(tcnt)
        taxon_counts_attributes_filtered << tcnt
      end
    end
    # Set created_at and updated_at
    current_time = Time.now.utc # to match TaxonLineage date range comparison
    taxon_counts_attributes_filtered.each do |tcnt|
      tcnt["created_at"] = current_time
      tcnt["updated_at"] = current_time
    end
    update(taxon_counts_attributes: taxon_counts_attributes_filtered)

    # aggregate the data at genus level
    generate_aggregate_counts('genus') unless multihit?
    # merge more accurate name information from lineages table
    update_names
    # denormalize superkingdom_taxid into taxon_counts
    if multihit?
      update_superkingdoms
    else
      update_genera
    end
    # label taxa as phage or non-phage
    update_is_phage

    # rm the json
    _stdout, _stderr, _status = Open3.capture3("rm -f #{downloaded_json_path}")
  end

  def db_load_byteranges
    byteranges_json_s3_path = "#{postprocess_output_s3_path}/#{TAXID_BYTERANGE_JSON_NAME}"
    downloaded_byteranges_path = PipelineRun.download_file(byteranges_json_s3_path, local_json_path)
    taxon_byteranges_csv_file = "#{local_json_path}/taxon_byteranges"
    hash_array_json2csv(downloaded_byteranges_path, taxon_byteranges_csv_file, %w[taxid hit_type first_byte last_byte])
    ` cd #{local_json_path};
      sed -e 's/$/,#{id}/' -i taxon_byteranges;
      mysqlimport --replace --local --user=$DB_USERNAME --host=#{rds_host} --password=$DB_PASSWORD --columns=taxid,hit_type,first_byte,last_byte,pipeline_run_id --fields-terminated-by=',' idseq_#{Rails.env} taxon_byteranges;
    `
    _stdout, _stderr, _status = Open3.capture3("rm -f #{downloaded_byteranges_path}")
  end

  def s3_file_for(output)
    case output
    when "ercc_counts"
      "#{host_filter_output_s3_path}/#{ERCC_OUTPUT_NAME}"
    when "taxon_counts"
      "#{alignment_output_s3_path}/#{taxon_counts_json_name}"
    when "taxon_byteranges"
      "#{postprocess_output_s3_path}/#{TAXID_BYTERANGE_JSON_NAME}"
    end
  end

  def output_ready?(output)
    file_generated(s3_file_for(output))
  end

  def output_state_hash(output_states_by_pipeline_run_id)
    h = {}
    run_output_states = output_states_by_pipeline_run_id[id] || []
    run_output_states.each do |o|
      h[o.output] = o.state
    end
    h
  end

  def status_display(output_states_by_pipeline_run_id)
    status_display_helper(output_state_hash(output_states_by_pipeline_run_id), results_finalized)
  end

  def pre_result_monitor?
    results_finalized.nil?
  end

  def check_and_enqueue(output_state)
    # If the pipeline monitor tells us that no jobs are running anymore,
    # yet outputs are not available, we need to draw the conclusion that
    # those outputs should be marked as failed. Otherwise we will never
    # stop checking for them.
    # [ TODO: move the check on "finalized" (column managed by pipeline_monitor)
    #   to an S3 interface in order to give us the option of running pipeline_monitor
    #   in a new environment that result_monitor does not have access to.
    # ]
    output = output_state.output
    state = output_state.state
    return unless state == STATUS_UNKNOWN
    if output_ready?(output)
      output_state.update(state: STATUS_LOADING_QUEUED)
      Resque.enqueue(ResultMonitorLoader, id, output)
    elsif finalized? && pipeline_run_stages.order(:step_number).last.updated_at < 1.minute.ago
      # check if job is done more than a minute ago
      output_state.update(state: STATUS_FAILED)
    end
  end

  def handle_success
    # Check if this was the last run in a project and act accordingly:
    if sample.project.results_complete?
      notify_users
      sample.project.create_or_update_project_background if sample.project.background_flag == 1
    end
  end

  def load_stats_file
    stats_s3 = "#{output_s3_path_with_version}/#{STATS_JSON_NAME}"
    # TODO: Remove the datetime check?
    if file_generated_since_jobstats?(stats_s3)
      load_job_stats(stats_s3)
    end
  end

  def all_output_states_terminal?
    output_states.pluck(:state).all? { |s| [STATUS_LOADED, STATUS_FAILED, STATUS_LOADING_ERROR].include?(s) }
  end

  def all_output_states_loaded?
    output_states.pluck(:state).all? { |s| s == STATUS_LOADED }
  end

  def monitor_results
    return if results_finalized?

    # Get pipeline_version, which determines S3 locations of output files.
    # If pipeline version is not present, we cannot load results yet.
    # [ We use "file_generated_since_run(pipeline_version_file)" because "pipeline_version_file"
    #   is not in the versioned result folder, so it gets overwritten with each new run.
    #   TODO: change that, so that we can get rid of "file_generated_since_run".
    # ]
    if pipeline_version.blank? && file_generated_since_run(pipeline_version_file)
      update(pipeline_version: fetch_pipeline_version)
    end
    return if pipeline_version.blank?

    # Load any new outputs that have become available:
    output_states.each do |o|
      check_and_enqueue(o)
    end

    # Update job stats:
    load_stats_file

    # Check if run is complete:
    if all_output_states_terminal?
      if all_output_states_loaded?
        update(results_finalized: FINALIZED_SUCCESS)
        handle_success
      else
        update(results_finalized: FINALIZED_FAIL)
      end
    end
  end

  def file_generated_since_jobstats?(s3_path)
    # If there is no file, return false
    stdout, _stderr, status = Open3.capture3("aws", "s3", "ls", s3_path.to_s)
    return false unless status.exitstatus.zero?
    # If there is a file and there are no existing job_stats yet, return true
    existing_jobstats = job_stats.first
    return true unless existing_jobstats
    # If there is a file and there are job_stats, check if the file supersedes the job_stats:
    begin
      s3_file_time = DateTime.strptime(stdout[0..18], "%Y-%m-%d %H:%M:%S")
      return (s3_file_time && existing_jobstats.created_at && s3_file_time > existing_jobstats.created_at)
    rescue
      return nil
    end
  end

  def load_job_stats(stats_json_s3_path)
    downloaded_stats_path = PipelineRun.download_file(stats_json_s3_path, local_json_path)
    return unless downloaded_stats_path
    stats_array = JSON.parse(File.read(downloaded_stats_path))
    stats_array = stats_array.select { |entry| entry.key?("task") }
    job_stats.destroy_all
    update(job_stats_attributes: stats_array)
    _stdout, _stderr, _status = Open3.capture3("rm -f #{downloaded_stats_path}")
  end

  def update_job_status
    prs = active_stage
    if prs.nil?
      # all stages succeeded
      self.finalized = 1
      self.job_status = STATUS_CHECKED
    else
      if prs.failed?
        self.job_status = STATUS_FAILED
        self.finalized = 1
        Airbrake.notify("Sample #{sample.id} failed #{prs.name}")
      elsif !prs.started?
        # we're moving on to a new stage
        prs.run_job
      else
        # still running
        prs.update_job_status
      end
      self.job_status = "#{prs.step_number}.#{prs.name}-#{prs.job_status}"
      self.job_status += "|#{STATUS_READY}" if report_ready?
    end
    compile_stats_file
    save
  end

  def compile_stats_file
    res_folder = output_s3_path_with_version
    stdout, stderr, status = Open3.capture3("aws s3 ls #{res_folder}/ | grep count$")
    unless status.exitstatus.zero?
      Rails.logger.info("No .count files found: #{stderr}")
      return
    end

    # Compile all counts
    # Ex: [{"total_reads": 1122}, {"task": "star_out", "reads_after": 832}... {"adjusted_remaining_reads": 474}]
    all_counts = []
    stdout.split("\n").each do |line|
      fname = line.split(" ")[3] # Last col in line
      raw = `aws s3 cp #{res_folder}/#{fname} -`
      contents = JSON.parse(raw)
      # Ex: {"gsnap_filter_out": 194}
      contents.each do |key, count|
        all_counts << { task: key, reads_after: count }
      end
    end

    # Load total reads
    total = all_counts.detect { |entry| entry.value?("fastqs") }
    if total
      all_counts << { total_reads: total[:reads_after] }
      self.total_reads = total[:reads_after]
    end

    # Load truncation
    truncation = all_counts.detect { |entry| entry.value?("truncated") }
    if truncation
      self.truncated = truncation[:reads_after]
    end

    # Load subsample fraction
    sub_before = all_counts.detect { |entry| entry.value?("bowtie2_out") }
    sub_after = all_counts.detect { |entry| entry.value?("subsampled_out") }
    frac = -1
    if sub_before && sub_after
      frac = (1.0 * sub_after[:reads_after]) / sub_before[:reads_after]
      all_counts << { fraction_subsampled: frac }
      self.fraction_subsampled = frac
    end

    # Load remaining reads
    # This is an approximation multiplied by the subsampled ratio so that it
    # can be compared to total reads for the user. Number of reads after host
    # filtering step vs. total reads as if subsampling had never occurred.
    rem = all_counts.detect { |entry| entry.value?("gsnap_filter_out") }
    if rem && frac != -1
      adjusted_remaining_reads = (rem[:reads_after] * (1 / frac)).to_i
      all_counts << { adjusted_remaining_reads: adjusted_remaining_reads }
      self.adjusted_remaining_reads = adjusted_remaining_reads
    else
      # gsnap filter is not done. use bowtie output as remaining reads
      bowtie = all_counts.detect { |entry| entry.value?("bowtie2_out") }
      if bowtie
        self.adjusted_remaining_reads = bowtie[:reads_after]
      end
    end

    # Load unidentified reads
    unidentified = all_counts.detect { |entry| entry.value?("unidentified_fasta") }
    if unidentified
      self.unmapped_reads = unidentified[:reads_after]
    end

    # Write JSON to a file
    tmp = Tempfile.new
    tmp.write(all_counts.to_json)
    tmp.close

    # Copy to S3. Overwrite if exists.
    _stdout, stderr, status = Open3.capture3("aws s3 cp #{tmp.path} #{res_folder}/#{STATS_JSON_NAME}")
    unless status.exitstatus.zero?
      Rails.logger.warn("Failed to write compiled stats file: #{stderr}")
    end
  end

  def local_json_path
    "#{LOCAL_JSON_PATH}/#{id}"
  end

  def self.download_file_with_retries(s3_path, destination_dir, max_tries)
    round = 0
    while round < max_tries
      downloaded = PipelineRun.download_file(s3_path, destination_dir)
      return downloaded if downloaded
      round += 1
      sleep(15)
    end
  end

  def self.download_file(s3_path, destination_dir)
    command = "mkdir -p #{destination_dir};"
    command += "aws s3 cp #{s3_path} #{destination_dir}/;"
    _stdout, _stderr, status = Open3.capture3(command)
    return nil unless status.exitstatus.zero?
    "#{destination_dir}/#{File.basename(s3_path)}"
  end

  def file_generated_since_run(s3_path)
    stdout, _stderr, status = Open3.capture3("aws", "s3", "ls", s3_path.to_s)
    return false unless status.exitstatus.zero?
    begin
      s3_file_time = DateTime.strptime(stdout[0..18], "%Y-%m-%d %H:%M:%S")
      return (s3_file_time && created_at && s3_file_time > created_at)
    rescue
      return nil
    end
  end

  def file_generated(s3_path)
    _stdout, _stderr, status = Open3.capture3("aws", "s3", "ls", s3_path.to_s)
    status.exitstatus.zero?
  end

  def generate_aggregate_counts(tax_level_name)
    current_date = Time.now.utc.to_s(:db)
    tax_level_id = TaxonCount::NAME_2_LEVEL[tax_level_name]
    # The unctagorizable_name chosen here is not important. The report page
    # endpoint makes its own choice about what to display in this case.  It
    # has general logic to handle this and other undefined cases uniformly.
    # What is crucially important is the uncategorizable_id.
    uncategorizable_id = TaxonLineage::MISSING_LINEAGE_ID.fetch(tax_level_name.to_sym, -9999)
    uncategorizable_name = "Uncategorizable as a #{tax_level_name}"
    TaxonCount.connection.execute(
      "INSERT INTO taxon_counts(pipeline_run_id, tax_id, name,
                                tax_level, count_type, count,
                                percent_identity, alignment_length, e_value,
                                species_total_concordant, genus_total_concordant, family_total_concordant,
                                percent_concordant, created_at, updated_at)
       SELECT #{id},
              IF(
                taxon_lineages.#{tax_level_name}_taxid IS NOT NULL,
                taxon_lineages.#{tax_level_name}_taxid,
                #{uncategorizable_id}
              ),
              IF(
                taxon_lineages.#{tax_level_name}_taxid IS NOT NULL,
                taxon_lineages.#{tax_level_name}_name,
                '#{uncategorizable_name}'
              ),
              #{tax_level_id},
              taxon_counts.count_type,
              sum(taxon_counts.count),
              sum(taxon_counts.percent_identity * taxon_counts.count) / sum(taxon_counts.count),
              sum(taxon_counts.alignment_length * taxon_counts.count) / sum(taxon_counts.count),
              sum(taxon_counts.e_value * taxon_counts.count) / sum(taxon_counts.count),
              /* We use AVG below because an aggregation function is needed, but all the entries being grouped are the same */
              AVG(species_total_concordant),
              AVG(genus_total_concordant),
              AVG(family_total_concordant),
              CASE #{tax_level_id}
                WHEN #{TaxonCount::TAX_LEVEL_SPECIES} THEN AVG(100.0 * taxon_counts.species_total_concordant) / sum(taxon_counts.count)
                WHEN #{TaxonCount::TAX_LEVEL_GENUS} THEN AVG(100.0 * taxon_counts.genus_total_concordant) / sum(taxon_counts.count)
                WHEN #{TaxonCount::TAX_LEVEL_FAMILY} THEN AVG(100.0 * taxon_counts.family_total_concordant) / sum(taxon_counts.count)
              END,
              '#{current_date}',
              '#{current_date}'
       FROM  taxon_lineages, taxon_counts
       WHERE (taxon_counts.created_at BETWEEN taxon_lineages.started_at AND taxon_lineages.ended_at) AND
             taxon_lineages.taxid = taxon_counts.tax_id AND
             taxon_counts.pipeline_run_id = #{id} AND
             taxon_counts.tax_level = #{TaxonCount::TAX_LEVEL_SPECIES}
      GROUP BY 1,2,3,4,5"
    )
  end

  def update_names
    # The names from the taxon_lineages table are preferred, but, not always
    # available;  this code merges them into taxon_counts.name.
    %w[species genus family].each do |level|
      level_id = TaxonCount::NAME_2_LEVEL[level]
      TaxonCount.connection.execute("
        UPDATE taxon_counts, taxon_lineages
        SET taxon_counts.name = taxon_lineages.#{level}_name,
            taxon_counts.common_name = taxon_lineages.#{level}_common_name
        WHERE taxon_counts.pipeline_run_id=#{id} AND
              taxon_counts.tax_level=#{level_id} AND
              taxon_counts.tax_id = taxon_lineages.taxid AND
              (taxon_counts.created_at BETWEEN taxon_lineages.started_at AND taxon_lineages.ended_at) AND
              taxon_lineages.#{level}_name IS NOT NULL
      ")
    end
  end

  def update_genera
    TaxonCount.connection.execute("
      UPDATE taxon_counts, taxon_lineages
      SET taxon_counts.genus_taxid = taxon_lineages.genus_taxid,
          taxon_counts.family_taxid = taxon_lineages.family_taxid,
          taxon_counts.superkingdom_taxid = taxon_lineages.superkingdom_taxid
      WHERE taxon_counts.pipeline_run_id=#{id} AND
            (taxon_counts.created_at BETWEEN taxon_lineages.started_at AND taxon_lineages.ended_at) AND
            taxon_lineages.taxid = taxon_counts.tax_id
    ")
  end

  def update_superkingdoms
    TaxonCount.connection.execute("
      UPDATE taxon_counts, taxon_lineages
      SET taxon_counts.superkingdom_taxid = taxon_lineages.superkingdom_taxid
      WHERE taxon_counts.pipeline_run_id=#{id}
            AND (taxon_counts.created_at BETWEEN taxon_lineages.started_at AND taxon_lineages.ended_at)
            AND taxon_counts.tax_id > #{TaxonLineage::INVALID_CALL_BASE_ID}
            AND taxon_lineages.taxid = taxon_counts.tax_id
    ")
    TaxonCount.connection.execute("
      UPDATE taxon_counts, taxon_lineages
      SET taxon_counts.superkingdom_taxid = taxon_lineages.superkingdom_taxid
      WHERE taxon_counts.pipeline_run_id=#{id}
            AND (taxon_counts.created_at BETWEEN taxon_lineages.started_at AND taxon_lineages.ended_at)
            AND taxon_counts.tax_id < #{TaxonLineage::INVALID_CALL_BASE_ID}
            AND taxon_lineages.taxid = MOD(ABS(taxon_counts.tax_id), ABS(#{TaxonLineage::INVALID_CALL_BASE_ID}))
    ")
  end

  def update_is_phage
    phage_families = TaxonLineage::PHAGE_FAMILIES_TAXIDS.join(",")
    TaxonCount.connection.execute("
      UPDATE taxon_counts
      SET is_phage = 1
      WHERE pipeline_run_id=#{id} AND
            family_taxid IN (#{phage_families})
    ")
  end

  def subsampled_reads
    # number of non-host reads that actually went through non-host alignment
    res = adjusted_remaining_reads
    if subsample
      # Ex: max of 1,000,000 or 2,000,000 reads
      max_reads = subsample * sample.input_files.count
      if adjusted_remaining_reads > max_reads
        res = max_reads
      end
    end
    res
    # 'subsample' is number of reads, respectively read pairs, to sample after host filtering
    # 'adjusted_remaining_reads' is number of individual reads remaining after subsampling
    # and host filtering, artificially multiplied to be at the original scale of total reads.
  end

  def subsample_fraction
    # fraction of non-host ("remaining") reads that actually went through non-host alignment
    if fraction_subsampled
      fraction_subsampled
    else # These should actually be the same value
      @cached_subsample_fraction ||= (1.0 * subsampled_reads) / adjusted_remaining_reads
    end
  end

  def subsample_suffix
    if pipeline_version && pipeline_version.to_f >= 2.0
      # New dag pipeline. no subsample folder
      return nil
    end
    all_suffix = pipeline_version ? "subsample_all" : ""
    subsample? ? "subsample_#{subsample}" : all_suffix
  end

  delegate :sample_output_s3_path, to: :sample

  def postprocess_output_s3_path
    pipeline_ver_str = ""
    pipeline_ver_str = "#{pipeline_version}/" if pipeline_version
    result = "#{sample.sample_postprocess_s3_path}/#{pipeline_ver_str}#{subsample_suffix}"
    result.chomp("/")
  end

  def alignment_viz_output_s3_path
    "#{postprocess_output_s3_path}/align_viz"
  end

  def assembly_output_s3_path(taxid = nil)
    "#{postprocess_output_s3_path}/assembly/#{taxid}".chomp("/")
  end

  def host_filter_output_s3_path
    output_s3_path_with_version
  end

  def output_s3_path_with_version
    if pipeline_version
      "#{sample.sample_output_s3_path}/#{pipeline_version}"
    else
      sample.sample_output_s3_path
    end
  end

  def s3_paths_for_taxon_byteranges
    # by tax_level and hit_type
    { TaxonCount::TAX_LEVEL_SPECIES => { 'NT' => "#{postprocess_output_s3_path}/#{Sample::SORTED_TAXID_ANNOTATED_FASTA}",
                                         'NR' => "#{postprocess_output_s3_path}/#{Sample::SORTED_TAXID_ANNOTATED_FASTA_NR}" },
      TaxonCount::TAX_LEVEL_GENUS => { 'NT' => "#{postprocess_output_s3_path}/#{Sample::SORTED_TAXID_ANNOTATED_FASTA_GENUS_NT}",
                                       'NR' => "#{postprocess_output_s3_path}/#{Sample::SORTED_TAXID_ANNOTATED_FASTA_GENUS_NR}" },
      TaxonCount::TAX_LEVEL_FAMILY => { 'NT' => "#{postprocess_output_s3_path}/#{Sample::SORTED_TAXID_ANNOTATED_FASTA_FAMILY_NT}",
                                        'NR' => "#{postprocess_output_s3_path}/#{Sample::SORTED_TAXID_ANNOTATED_FASTA_FAMILY_NR}" } }
  end

  def pipeline_version_file
    "#{sample.sample_output_s3_path}/#{PIPELINE_VERSION_FILE}"
  end

  def fetch_pipeline_version
    whole_version = `aws s3 cp #{pipeline_version_file} -`.strip
    whole_version =~ /(^\d+\.\d+).*/
    return Regexp.last_match(1)
  rescue
    return nil
  end

  def major_minor(version)
    # given "1.5" return [1, 5]
    version.split('.').map(&:to_i)
  end

  def after(v0, v1)
    # Return "true" when v0 >= v1
    return true unless v1
    return false unless v0
    v0_major, v0_minor = major_minor(v0)
    v1_major, v1_minor = major_minor(v1)
    return true if v0_major > v1_major
    return false if v0_major < v1_major
    v0_minor >= v1_minor
  end

  def multihit?
    after(pipeline_version || fetch_pipeline_version, "1.5")
  end

  def assembly?
    after(pipeline_version, "1000.1000")
    # Very big version number so we don't accidentally start going into assembly mode.
    # Once we decide to deploy the assembly pipeline, change "1000.1000" to the relevant version number of idseq-pipeline.
  end

  def alignment_output_s3_path
    pipeline_ver_str = ""
    pipeline_ver_str = "#{pipeline_version}/" if pipeline_version
    result = "#{sample.sample_output_s3_path}/#{pipeline_ver_str}#{subsample_suffix}"
    result.chomp("/")
  end

  def load_ercc_counts
    ercc_s3_path = "#{host_filter_output_s3_path}/#{ERCC_OUTPUT_NAME}"
    _stdout, _stderr, status = Open3.capture3("aws", "s3", "ls", ercc_s3_path)
    return unless status.exitstatus.zero?
    ercc_lines = `aws s3 cp #{ercc_s3_path} - | grep 'ERCC' | cut -f1,2`
    ercc_counts_array = []
    ercc_lines.split(/\r?\n/).each do |line|
      fields = line.split("\t")
      name = fields[0]
      count = fields[1].to_i
      ercc_counts_array << { name: name, count: count }
    end
    update(ercc_counts_attributes: ercc_counts_array)
    update(total_ercc_reads: ercc_counts_array.map { |entry| entry[:count] }.sum)
  end

  delegate :project_id, to: :sample

  def notify_users
    project = Project.find(project_id)
    number_samples = Sample.where(project_id: project_id).count
    project_name = project.name
    user_emails = project.users.map(&:email)
    user_emails.each do |user_email|
      email_arguments = { user_email: user_email,
                          project_name: project_name,
                          project_id: project_id,
                          number_samples: number_samples }
      UserMailer.project_complete_email(email_arguments).deliver_now
    end
  end

  def compare_ercc_counts
    return nil if ercc_counts.empty?
    ercc_counts_by_name = Hash[ercc_counts.map { |a| [a.name, a] }]

    ret = []
    ErccCount::BASELINE.each do |baseline|
      actual = ercc_counts_by_name[baseline[:ercc_id]]
      actual_count = actual && actual.count || 0
      ret << {
        name: baseline[:ercc_id],
        actual: actual_count,
        expected: baseline[:concentration_in_mix_1_attomolesul]
      }
    end
    ret
  end
end
