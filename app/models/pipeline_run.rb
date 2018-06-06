require 'open3'
require 'json'
class PipelineRun < ApplicationRecord
  include ApplicationHelper
  include PipelineOutputsHelper
  belongs_to :sample
  has_many :pipeline_run_stages
  accepts_nested_attributes_for :pipeline_run_stages
  has_and_belongs_to_many :backgrounds

  has_many :taxon_counts, dependent: :destroy
  has_many :job_stats, dependent: :destroy
  has_many :taxon_byteranges, dependent: :destroy
  has_many :ercc_counts, dependent: :destroy
  accepts_nested_attributes_for :taxon_counts
  accepts_nested_attributes_for :job_stats
  accepts_nested_attributes_for :taxon_byteranges
  accepts_nested_attributes_for :ercc_counts

  DEFAULT_SUBSAMPLING = 1_000_000 # number of reads to subsample to, after host filtering
  OUTPUT_JSON_NAME = 'idseq_web_sample.json'.freeze
  MULTIHIT_OUTPUT_JSON_NAME = 'multihit_idseq_web_sample.json'.freeze
  STATS_JSON_NAME = 'stats.json'.freeze
  VERSION_JSON_NAME = 'versions.json'.freeze
  ERCC_OUTPUT_NAME = 'reads_per_gene.star.tab'.freeze
  TAXID_BYTERANGE_JSON_NAME = 'taxid_locations_combined.json'.freeze
  ASSEMBLY_STATUSFILE = 'job-complete'.freeze
  LOCAL_JSON_PATH = '/app/tmp/results_json'.freeze
  INPUT_TRUNCATED_FILE = 'input_truncated.txt'.freeze
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
  #    columns "result_status", "results_finalized".
  # The result status is a JSON string where keys are outputs and values are status,
  # e.g.  "{\"ercc_counts\":\"LOADED\",\"taxon_counts\":\"LOADING\",\"taxon_byteranges\":\"EMPTY\"}".
  # The progression for an output's status is as follows:
  # EMPTY -> LOADING_QUEUED -> LOADING -> LOADED / FAILED.
  # When all results have been loaded, or the PIPELINE MONITOR indicates no new outputs will be
  # forthcoming (due to either success or failure), results_finalized is set to 1 in order
  # to indicate to the RESULT MONITOR that it can stop attending to the pipeline_run.
  # In the case of failure, we determine whether the main report is nevertheless ready
  # by checking whether REPORT_READY_OUTPUT has been loaded.

  STATUS_LOADED = 'LOADED'.freeze
  STATUS_UNKNOWN = 'UNKNOWN'.freeze
  STATUS_LOADING = 'LOADING'.freeze
  STATUS_LOADING_QUEUED = 'LOADING_QUEUED'.freeze

  LOADERS_BY_OUTPUT = { "ercc_counts" => "db_load_ercc_counts",
                        "taxon_counts" => "db_load_taxon_counts",
                        "taxon_byteranges" => "db_load_byteranges" }.freeze
  REPORT_READY_OUTPUT = "taxon_counts".freeze

  before_create :initialize_result_status, :create_run_stages

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
    where(results_finalized: 0)
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
    results_finalized == 1
  end

  def failed?
    /FAILED/ =~ job_status
  end

  def initialize_result_status
    # We explicitly set a value for result_status so that we can unambiguously
    # identify pipeline_runs that predate result_status by the fact
    # that their result_status is nil.
    h = {}
    # First, determine which outputs need to be considered:
    outputs = %w[taxon_counts taxon_byteranges]
    outputs = ["ercc_counts"] + outputs unless skip_host_filtering?
    # Then initialize each output's status:
    outputs.each do |o|
      h[o] = STATUS_UNKNOWN
    end
    self.result_status = h.to_json
  end

  def create_run_stages
    # Host Filtering
    run_stages = []
    unless sample.host_genome && sample.host_genome.name == HostGenome::NO_HOST_NAME
      run_stages << PipelineRunStage.new(
        step_number: 1,
        name: PipelineRunStage::HOST_FILTERING_STAGE_NAME,
        job_command_func: 'host_filtering_command'
      )
    end

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
    save
  end

  def report_ready?
    clause_for_old_runs = result_status.nil? && (job_status == STATUS_CHECKED || (ready_step && pipeline_run_stages.find_by(step_number: ready_step) && pipeline_run_stages.find_by(step_number: ready_step).job_status == STATUS_LOADED))
    # TODO: migrate old runs so we don't need to deal with them separately in the code
    result_status_for(REPORT_READY_OUTPUT) == STATUS_LOADED || clause_for_old_runs
  end

  def succeeded?
    job_status == STATUS_CHECKED
  end

  def db_load_ercc_counts
    # TODO: break this function up into 3 different target outputs / loader commands
    #       rather than combining several outputs in 1 function

    # Load version info applicable to host filtering
    version_s3_path = "#{host_filter_output_s3_path}/#{VERSION_JSON_NAME}"
    self.version = `aws s3 cp #{version_s3_path} -`

    # Check if input was truncated
    truncation_file = "#{host_filter_output_s3_path}/#{INPUT_TRUNCATED_FILE}"
    _stdout, _stderr, status = Open3.capture3("aws", "s3", "ls", truncation_file)
    self.truncated = `aws s3 cp #{truncation_file} -`.split("\n")[0].to_i if status.exitstatus.zero?
    save

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
    multihit? ? MULTIHIT_OUTPUT_JSON_NAME : OUTPUT_JSON_NAME
  end

  def invalid_family_call?(tcnt)
    # TODO:  Better family support.
    tcnt['family_taxid'].to_i < TaxonLineage::INVALID_CALL_BASE_ID
  rescue
    false
  end

  def load_job_stats(stats_json_s3_path)
    downloaded_stats_path = PipelineRun.download_file(stats_json_s3_path, local_json_path)
    return unless downloaded_stats_path
    stats_array = JSON.parse(File.read(downloaded_stats_path))
    update(total_reads: (stats_array[0] || {})['total_reads'] || 0)
    stats_array = stats_array.select { |entry| entry.key?("task") }
    job_stats.destroy_all
    update(job_stats_attributes: stats_array)
    _stdout, _stderr, _status = Open3.capture3("rm -f #{downloaded_stats_path}")
  end

  def db_load_taxon_counts
    output_json_s3_path = "#{alignment_output_s3_path}/#{taxon_counts_json_name}"
    downloaded_json_path = PipelineRun.download_file(output_json_s3_path, local_json_path)
    return unless downloaded_json_path

    json_dict = JSON.parse(File.read(downloaded_json_path))
    pipeline_output_dict = json_dict['pipeline_output']
    pipeline_output_dict.slice!('remaining_reads', 'total_reads', 'taxon_counts_attributes')
    self.total_reads = pipeline_output_dict['total_reads']
    self.remaining_reads = pipeline_output_dict['remaining_reads']
    self.unmapped_reads = count_unmapped_reads
    self.fraction_subsampled = subsample_fraction
    save

    version_s3_path = "#{alignment_output_s3_path}/#{VERSION_JSON_NAME}"
    update(version: `aws s3 cp #{version_s3_path} -`)

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
    file_generated_since_run(s3_file_for(output))
  end

  def update_result_status(field, from_value, to_value)
    PipelineRun.transaction do
      status_hash = result_status_hash
      # Check if from_value is satisfied
      initial_value = status_hash[field]
      if initial_value != from_value
        raise "update_result_status failed: expected initial value #{from_value} for #{field}, " \
              "was #{initial_value}"
      end
      # Perform update
      status_hash[field] = to_value
      update(result_status: status_hash.to_json)
    end
  end

  def result_status_for(field)
    status_hash = result_status_hash
    status_hash[field]
  end

  def result_status_hash
    result_status ? JSON.parse(result_status) : {}
  end

  def status_display(h = result_status_hash, results_finalized_var = results_finalized)
    # Status display for the frontend.
    # This function would be simpler if we used active_stage (job monitor),
    # but we want to use result_status instead (result monitor)
    # so that it becomes easy to expose availability of specific results
    # with more granularity later if we desire.
    if results_finalized_var == 1
      if [h["taxon_byteranges"], h["taxon_counts"]].all? { |s| s == STATUS_LOADED }
        "COMPLETE"
      elsif h["taxon_counts"] == STATUS_LOADED
        "COMPLETE*"
      else
        "FAILED"
      end
    elsif h["taxon_counts"] == STATUS_LOADED
      # alignment succeeded, postprocessing in progress
      "POST PROCESSING"
    elsif h["ercc_counts"] == STATUS_LOADED
      # host-filtering succeeded, alignment in progress
      "ALIGNMENT"
    else
      # host-filtering in progress
      "HOST FILTERING"
    end
  end

  def status_display_pre_result_monitor(run_stages)
    # TODO: remove the need for this function by migrating old runs
    status_by_loader = {}
    old_loaders_by_output = { "db_load_host_filtering" => "ercc_counts",
                              "db_load_alignment" => "taxon_counts",
                              "db_load_postprocess" => "taxon_byteranges" }
    run_stages.each do |rs|
      status_by_loader[old_loaders_by_output[rs.load_db_command_func]] = rs.job_status
    end
    status_display(status_by_loader, finalized)
  end

  def status_display_pre_run_stages
    # TODO: remove the need for this function by migrating old runs
    if %w[CHECKED SUCCEEDED].include?(job_status)
      'COMPLETE'
    elsif %w[FAILED ERROR].include?(job_status)
      'FAILED'
    elsif %w[RUNNING LOADED].include?(job_status)
      'IN PROGRESS'
    else
      'WAITING'
    end
  end

  def check_and_enqueue(output)
    # If the pipeline monitor tells us that no jobs are running anymore,
    # yet outputs are not available, we need to draw the conclusion that
    # those outputs should be marked as failed. Otherwise we will never
    # stop checking for them.
    # [ TODO: move the check on "finalized" (column managed by pipeline_monitor)
    #   to an S3 interface in order to give us the option of running pipeline_monitor
    #   in a new environment that result_monitor does not have access to.
    # ]
    if finalized && !output_ready?(output)
      update_result_status(output, STATUS_UNKNOWN, STATUS_FAILED)
      return
    end
    # Otherwise, if the output is ready and has not yet been loaded or enqueued
    # for loading, enqueue a loader job.
    if output_ready?(output) && result_status_for(output) == STATUS_UNKNOWN
      update_result_status(output, STATUS_UNKNOWN, STATUS_LOADING_QUEUED)
      Resque.enqueue(ResultMonitorLoader, id, output)
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
    # TODO: make it a single file rather than using stage-specific.
    host_filtering_job_stats_s3 = "#{host_filter_output_s3_path}/#{STATS_JSON_NAME}"
    alignment_job_stats_s3 = "#{alignment_output_s3_path}/#{STATS_JSON_NAME}"
    if file_generated_since_jobstats?(alignment_job_stats_s3)
      load_job_stats(alignment_job_stats_s3)
    elsif file_generated_since_jobstats?(host_filtering_job_stats_s3)
      load_job_stats(host_filtering_job_stats_s3)
    end
  end

  def skip_host_filtering?
    sample.host_genome && sample.host_genome.name == HostGenome::NO_HOST_NAME
  end

  def terminal_result_status?
    result_status_hash.values.all? { |s| [STATUS_LOADED, STATUS_FAILED].include?(s) }
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
    outputs = result_status_hash.keys
    outputs.each do |o|
      check_and_enqueue(o)
    end

    # Update job stats:
    load_stats_file

    # Check if run is complete:
    if terminal_result_status?
      update(results_finalized: 1) # ensures monitor_results won't run again on this pipeline_run
    end

    if outputs.all? { |o| result_status_for(o) == STATUS_LOADED }
      handle_success
    end
  end

  def update_job_status
    prs = active_stage
    if prs.nil?
      # all stages succeeded
      self.finalized = 1
      self.job_status = STATUS_CHECKED
      save
      return
    end

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
    save
  end

  def local_json_path
    "#{LOCAL_JSON_PATH}/#{id}"
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

  def file_generated_since_jobstats?(s3_path)
    # If there is no file, return false
    stdout, _stderr, status = Open3.capture3("aws", "s3", "ls", s3_path.to_s)
    return false unless status.exitstatus.zero?
    # If there is a file and there are no existing job_stats yet, return true
    existing_jobstats = job_stats
    return true if existing_jobstats.empty?
    # If there is a file and there are job_stats, check if the file supersedes the job_stats:
    begin
      s3_file_time = DateTime.strptime(stdout[0..18], "%Y-%m-%d %H:%M:%S")
      return (s3_file_time && existing_jobstats.created_at && s3_file_time > existing_jobstats.created_at)
    rescue
      return nil
    end
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
    return remaining_reads unless subsample
    result = subsample * sample.input_files.count
    remaining_reads < result ? remaining_reads : result
    # 'subsample' is number of reads, respectively read pairs, to sample after host filtering
    # 'remaining_reads'a is number of individual reads remaining after host filtering
  end

  def subsample_fraction
    # fraction of non-host ("remaining") reads that actually went through non-host alignment
    @cached_subsample_fraction ||= (1.0 * subsampled_reads) / remaining_reads
  end

  def subsample_suffix
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
    pipeline_ver_str = ""
    pipeline_ver_str = "/#{pipeline_version}" if pipeline_version
    "#{sample.sample_output_s3_path}#{pipeline_ver_str}"
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
    "#{sample.sample_output_s3_path}/pipeline_version.txt"
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

  def count_unmapped_reads
    _stdout, _stderr, status = Open3.capture3("aws", "s3", "ls", sample.unidentified_fasta_s3_path)
    return unless status.exitstatus.zero?
    `aws s3 cp #{sample.unidentified_fasta_s3_path} - | grep '^>' | wc -l`.to_i
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
