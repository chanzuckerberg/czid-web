require 'open3'
require 'json'
require 'csv'
class PipelineRun < ApplicationRecord
  include ApplicationHelper
  include PipelineOutputsHelper
  include PipelineRunsHelper
  belongs_to :sample
  belongs_to :alignment_config
  has_many :pipeline_run_stages, dependent: :destroy
  accepts_nested_attributes_for :pipeline_run_stages
  has_and_belongs_to_many :backgrounds
  has_and_belongs_to_many :phylo_trees
  has_and_belongs_to_many :bulk_downloads

  has_many :output_states, dependent: :destroy
  has_many :taxon_counts, dependent: :destroy
  has_many :job_stats, dependent: :destroy
  has_many :taxon_byteranges, dependent: :destroy
  has_many :ercc_counts, dependent: :destroy
  has_many :amr_counts, dependent: :destroy
  has_many :contigs, dependent: :destroy
  has_one :insert_size_metric_set, dependent: :destroy
  accepts_nested_attributes_for :taxon_counts
  accepts_nested_attributes_for :job_stats
  accepts_nested_attributes_for :taxon_byteranges
  accepts_nested_attributes_for :ercc_counts
  accepts_nested_attributes_for :amr_counts
  accepts_nested_attributes_for :contigs
  accepts_nested_attributes_for :insert_size_metric_set

  DEFAULT_SUBSAMPLING = 1_000_000 # number of fragments to subsample to, after host filtering
  DEFAULT_MAX_INPUT_FRAGMENTS = 75_000_000 # max fragments going into the pipeline
  ADAPTER_SEQUENCES = { "single-end" => "s3://idseq-database/adapter_sequences/illumina_TruSeq3-SE.fasta",
                        "paired-end" => "s3://idseq-database/adapter_sequences/illumina_TruSeq3-PE-2_NexteraPE-PE.fasta", }.freeze

  GSNAP_CHUNK_SIZE = 60_000
  RAPSEARCH_CHUNK_SIZE = 80_000
  GSNAP_MAX_CONCURRENT = 2
  RAPSEARCH_MAX_CONCURRENT = 8
  MAX_CHUNKS_IN_FLIGHT = 32

  SORTED_TAXID_ANNOTATED_FASTA = 'taxid_annot_sorted_nt.fasta'.freeze
  SORTED_TAXID_ANNOTATED_FASTA_NR = 'taxid_annot_sorted_nr.fasta'.freeze
  SORTED_TAXID_ANNOTATED_FASTA_GENUS_NT = 'taxid_annot_sorted_genus_nt.fasta'.freeze
  SORTED_TAXID_ANNOTATED_FASTA_GENUS_NR = 'taxid_annot_sorted_genus_nr.fasta'.freeze
  SORTED_TAXID_ANNOTATED_FASTA_FAMILY_NT = 'taxid_annot_sorted_family_nt.fasta'.freeze
  SORTED_TAXID_ANNOTATED_FASTA_FAMILY_NR = 'taxid_annot_sorted_family_nr.fasta'.freeze

  DAG_ANNOTATED_FASTA_BASENAME = 'taxid_annot.fasta'.freeze
  DAG_ANNOTATED_COUNT_BASENAME = 'refined_annotated_out.count'.freeze
  DAG_UNIDENTIFIED_FASTA_BASENAME = 'unidentified.fa'.freeze
  UNIDENTIFIED_FASTA_BASENAME = 'unidentified.fasta'.freeze
  MULTIHIT_FASTA_BASENAME = 'accessions.rapsearch2.gsnapl.fasta'.freeze
  HIT_FASTA_BASENAME = 'taxids.rapsearch2.filter.deuterostomes.taxids.gsnapl.unmapped.bowtie2.lzw.cdhitdup.priceseqfilter.unmapped.star.fasta'.freeze

  GSNAP_M8 = "gsnap.m8".freeze
  RAPSEARCH_M8 = "rapsearch2.m8".freeze
  OUTPUT_JSON_NAME = 'taxon_counts.json'.freeze
  PIPELINE_VERSION_FILE = "pipeline_version.txt".freeze
  STATS_JSON_NAME = "stats.json".freeze
  INPUT_VALIDATION_NAME = "validate_input_summary.json".freeze
  INVALID_STEP_NAME = "invalid_step_input.json".freeze
  NONHOST_FASTQ_OUTPUT_NAME = 'taxid_annot.fasta'.freeze
  ERCC_OUTPUT_NAME = 'reads_per_gene.star.tab'.freeze
  AMR_DRUG_SUMMARY_RESULTS = 'amr_summary_results.csv'.freeze
  AMR_FULL_RESULTS_NAME = 'amr_processed_results.csv'.freeze
  TAXID_BYTERANGE_JSON_NAME = 'taxid_locations_combined.json'.freeze
  REFINED_TAXON_COUNTS_JSON_NAME = 'assembly/refined_taxon_counts.json'.freeze
  REFINED_TAXID_BYTERANGE_JSON_NAME = 'assembly/refined_taxid_locations_combined.json'.freeze
  READS_PER_GENE_STAR_TAB_NAME = 'reads_per_gene.star.tab'.freeze

  # Insert size metrics constants
  INSERT_SIZE_METRICS_OUTPUT_NAME = 'picard_insert_metrics.txt'.freeze
  MEDIAN_INSERT_SIZE_NAME = 'MEDIAN_INSERT_SIZE'.freeze
  MODE_INSERT_SIZE_NAME = 'MODE_INSERT_SIZE'.freeze
  MEDIAN_ABSOLUTE_DEVIATION_NAME = 'MEDIAN_ABSOLUTE_DEVIATION'.freeze
  MIN_INSERT_SIZE_NAME = 'MIN_INSERT_SIZE'.freeze
  MAX_INSERT_SIZE_NAME = 'MAX_INSERT_SIZE'.freeze
  MEAN_INSERT_SIZE_NAME = 'MEAN_INSERT_SIZE'.freeze
  STANDARD_DEVIATION_NAME = 'STANDARD_DEVIATION'.freeze
  READ_PAIRS_NAME = 'READ_PAIRS'.freeze

  ASSEMBLY_PREFIX = 'assembly/refined_'.freeze
  ASSEMBLED_CONTIGS_NAME = 'assembly/contigs.fasta'.freeze
  ASSEMBLED_STATS_NAME = 'assembly/contig_stats.json'.freeze
  COVERAGE_VIZ_SUMMARY_JSON_NAME = 'coverage_viz_summary.json'.freeze
  CONTIG_SUMMARY_JSON_NAME = 'assembly/combined_contig_summary.json'.freeze
  CONTIG_NT_TOP_M8 = 'assembly/gsnap.blast.top.m8'.freeze
  CONTIG_NR_TOP_M8 = 'assembly/rapsearch2.blast.top.m8'.freeze
  CONTIG_MAPPING_NAME = 'assembly/contig2taxon_lineage.csv'.freeze

  LOCAL_JSON_PATH = '/app/tmp/results_json'.freeze
  LOCAL_AMR_FULL_RESULTS_PATH = '/app/tmp/amr_full_results'.freeze

  PIPELINE_VERSION_WHEN_NULL = '1.0'.freeze
  MIN_CONTIG_READS = 4 # minimal # reads mapped to the  contig
  M8_FIELDS = ["Query", "Accession", "Percentage Identity", "Alignment Length",
               "Number of mismatches", "Number of gap openings",
               "Start of alignment in query", "End of alignment in query",
               "Start of alignment in accession", "End of alignment in accession",
               "E-value", "Bitscore",].freeze
  M8_FIELDS_TO_EXTRACT = [1, 2, 3, 4, 10, 11].freeze

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
                        "contig_counts" => "db_load_contig_counts",
                        "taxon_byteranges" => "db_load_byteranges",
                        "amr_counts" => "db_load_amr_counts",
                        "insert_size_metrics" => "db_load_insert_size_metrics", }.freeze
  # Functions for checking if an optional output should have been generated
  # Don't include optional outputs
  CHECKERS_BY_OUTPUT = { "insert_size_metrics" => "should_have_insert_size_metrics" }.freeze
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

  # Constants for alignment chunk scheduling,
  # shared between idseq-web/app/jobs/autoscaling.py and idseq-dag/idseq_dag/util/server.py:
  MAX_JOB_DISPATCH_LAG_SECONDS = 900
  JOB_TAG_PREFIX = "RunningIDseqBatchJob_".freeze
  JOB_TAG_KEEP_ALIVE_SECONDS = 600
  DRAINING_TAG = "draining".freeze

  # Triggers a run for new samples by defining output states and run stages configurations.
  # *Exception* for cloned pipeline runs that already have results and finalized status
  before_create :create_output_states, :create_run_stages, unless: :results_finalized?

  delegate :status_url, to: :sample

  def parse_dag_vars
    JSON.parse(dag_vars || "{}")
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

  def self.count_chunks(run_ids, known_num_reads, count_config, completed_chunks)
    chunk_size = count_config[:chunk_size]
    can_pair_chunks = count_config[:can_pair_chunks]
    is_run_paired = count_config[:is_run_paired]
    num_chunks_by_run_id = {}
    run_ids.each do |pr_id|
      # A priori, each run will count for 1 chunk
      num_chunks = 1
      # If number of non-host reads is known, we can compute the actual number of chunks from it
      if known_num_reads[pr_id]
        num_reads = known_num_reads[pr_id]
        if can_pair_chunks && is_run_paired[pr_id]
          num_reads /= 2.0
        end
        num_chunks = (num_reads / chunk_size.to_f).ceil
      end
      # If any chunks have already completed, we can subtract them
      num_chunks = [0, num_chunks - completed_chunks[pr_id]].max if completed_chunks[pr_id]
      # Due to rate limits in idseq-dag, there is a cap on the number of chunks dispatched concurrently by a single job
      num_chunks = [num_chunks, MAX_CHUNKS_IN_FLIGHT].min
      num_chunks_by_run_id[pr_id] = num_chunks
    end
    num_chunks_by_run_id.values.sum
  end

  def self.count_alignment_chunks_in_progress
    # Get run ids in progress
    need_alignment = in_progress_at_stage_1_or_2
    # Get numbers of non-host reads to estimate total number of chunks
    in_progress_job_stats = JobStat.where(pipeline_run_id: need_alignment.pluck(:id))
    last_host_filter_step = "subsampled_out"
    known_num_reads = Hash[in_progress_job_stats.where(task: last_host_filter_step).pluck(:pipeline_run_id, :reads_after)]
    # Determine which samples are paired-end to adjust chunk count
    runs_by_sample_id = need_alignment.index_by(&:sample_id)
    files_by_sample_id = InputFile.where(sample_id: need_alignment.pluck(:sample_id)).group_by(&:sample_id)
    is_run_paired = {}
    runs_by_sample_id.each do |sid, pr|
      is_run_paired[pr.id] = (files_by_sample_id[sid].count == 2)
    end
    # Get number of chunks that have already completed
    completed_gsnap_chunks = Hash[need_alignment.pluck(:id, :completed_gsnap_chunks)]
    completed_rapsearch_chunks = Hash[need_alignment.pluck(:id, :completed_rapsearch_chunks)]
    # Compute number of chunks that still need to be processed
    count_configs = {
        gsnap: {
            chunk_size: GSNAP_CHUNK_SIZE,
            can_pair_chunks: true, # gsnap can take paired inputs
            is_run_paired: is_run_paired,
        },
        rapsearch: {
            chunk_size: RAPSEARCH_CHUNK_SIZE,
            can_pair_chunks: false # rapsearch always takes a single input file
        },
    }
    gsnap_num_chunks = count_chunks(need_alignment.pluck(:id), known_num_reads, count_configs[:gsnap], completed_gsnap_chunks)
    rapsearch_num_chunks = count_chunks(need_alignment.pluck(:id), known_num_reads, count_configs[:rapsearch], completed_rapsearch_chunks)
    { gsnap: gsnap_num_chunks, rapsearch: rapsearch_num_chunks }
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

  def ready_for_cache?
    # This method is used to decide whether a report is ready to be cached, which is only the case
    # once a pipeline run is successful and all results are available.
    #   (1) "results_finalized == FINALIZED_SUCCESS" means all results destined for the DB
    #       have successfully been loaded from S3.
    #   (2) "job_status == STATUS_CHECKED" means all Batch jobs have completed successfully.
    #       This is important because certain outputs (e.g. coverage viz) are never loaded to
    #       the DB. Instead they are fetched at the time a report is viewed. We can only be
    #       certain that generation of those outputs is complete if the last Batch job has succeeded.
    results_finalized == FINALIZED_SUCCESS && job_status == STATUS_CHECKED
  end

  def failed?
    /FAILED/ =~ job_status || results_finalized == FINALIZED_FAIL
  end

  def create_output_states
    # First, determine which outputs we need:
    target_outputs = %w[ercc_counts taxon_counts contig_counts taxon_byteranges amr_counts insert_size_metrics]

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
    # TODO: (gdingle): rename to stage_number. See https://jira.czi.team/browse/IDSEQ-1912.
    PipelineRunStage::STAGE_INFO.each do |step_number, info|
      run_stages << PipelineRunStage.new(
          step_number: step_number,
          name: info[:name],
          job_command_func: info[:job_command_func]
      )
    end
    self.pipeline_run_stages = run_stages
  end

  def completed?
    return true if finalized?
    # Old version before run stages
    return true if pipeline_run_stages.blank? && (job_status == STATUS_FAILED || job_status == STATUS_CHECKED)
  end

  def active_stage
    # TODO: (gdingle): rename to stage_number. See https://jira.czi.team/browse/IDSEQ-1912.
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
    output_states.each { |o| o.update(state: STATUS_UNKNOWN) if o.state != STATUS_LOADED }
    save
  end

  def report_ready?
    os = output_states.find_by(output: REPORT_READY_OUTPUT)
    !os.nil? && os.state == STATUS_LOADED
  end

  def taxon_byte_ranges_available?
    return !taxon_byteranges.empty?
  end

  def align_viz_available?
    # TODO(tiago): we should not have to access aws
    align_summary_file = "#{alignment_viz_output_s3_path}.summary"
    return align_summary_file && get_s3_file(align_summary_file) ? true : false
  end

  # NOTE: not clear whether this is the complement of report_ready? method
  def report_failed?
    # The report failed if host filtering or alignment failed.
    host_filtering_status = output_states.find_by(output: "ercc_counts").state
    alignment_status = output_states.find_by(output: "taxon_byteranges").state
    host_filtering_status == STATUS_FAILED || alignment_status == STATUS_FAILED
  end

  def succeeded?
    job_status == STATUS_CHECKED
  end

  def db_load_ercc_counts
    ercc_s3_path = "#{host_filter_output_s3_path}/#{ERCC_OUTPUT_NAME}"
    _stdout, _stderr, status = Open3.capture3("aws", "s3", "ls", ercc_s3_path)
    return unless status.exitstatus.zero?
    ercc_lines = Syscall.pipe_with_output(["aws", "s3", "cp", ercc_s3_path, "-"], ["grep", "ERCC"], ["cut", "-f1,2"])
    ercc_counts_array = []
    ercc_lines.split(/\r?\n/).each do |line|
      fields = line.split("\t")
      name = fields[0]
      count = fields[1].to_i
      ercc_counts_array << { name: name, count: count }
    end
    update(ercc_counts_attributes: ercc_counts_array)
    total_ercc_reads = ercc_counts_array.pluck(:count).sum * sample.input_files.count
    update(total_ercc_reads: total_ercc_reads)
  end

  def host_filtering_stage
    pipeline_run_stages.find { |prs| prs["step_number"] == 1 }
  end

  def should_have_insert_size_metrics
    host_filtering_step_statuses = host_filtering_stage.step_statuses
    additional_outputs = get_additional_outputs(host_filtering_step_statuses, "star_out")
    return additional_outputs.include?(INSERT_SIZE_METRICS_OUTPUT_NAME)
  end

  private def extract_int_metric(metrics, metric_name)
    return nil unless metrics[metric_name]
    return metrics[metric_name].to_i
  end

  private def extract_float_metric(metrics, metric_name)
    return nil unless metrics[metric_name]
    return metrics[metric_name].to_f
  end

  def db_load_insert_size_metrics
    insert_size_metrics_s3_path = "#{host_filter_output_s3_path}/#{INSERT_SIZE_METRICS_OUTPUT_NAME}"
    _stdout, _stderr, status = Open3.capture3("aws", "s3", "ls", insert_size_metrics_s3_path)
    return unless status.exitstatus.zero?
    insert_size_metrics_raw = Syscall.pipe_with_output(["aws", "s3", "cp", insert_size_metrics_s3_path, "-"])
    tsv_lines = []
    tsv_header_line = -1
    insert_size_metrics_raw.lines.each_with_index do |line, index|
      if line.start_with?("## METRICS CLASS")
        tsv_header_line = index
      elsif tsv_header_line > 0 && index - tsv_header_line <= 2
        tsv_lines << CSV.parse_line(line, col_sep: "\t")
      elsif tsv_lines.length >= 2
        break
      end
    end
    if tsv_lines.length != 2
      error_message = "Pipeline run ##{id} has an insert size metrics file but metrics could not be found"
      LogUtil.log_err_and_airbrake(error_message)
      raise error_message
    end
    insert_size_metrics = {}
    tsv_lines[0].zip(tsv_lines[1]).each do |row|
      insert_size_metrics[row[0]] = row[1]
    end

    update(
        insert_size_metric_set_attributes: {
            median: extract_int_metric(insert_size_metrics, MEDIAN_INSERT_SIZE_NAME),
            mode: extract_int_metric(insert_size_metrics, MODE_INSERT_SIZE_NAME),
            median_absolute_deviation: extract_int_metric(insert_size_metrics, MEDIAN_ABSOLUTE_DEVIATION_NAME),
            min: extract_int_metric(insert_size_metrics, MIN_INSERT_SIZE_NAME),
            max: extract_int_metric(insert_size_metrics, MAX_INSERT_SIZE_NAME),
            mean: extract_float_metric(insert_size_metrics, MEAN_INSERT_SIZE_NAME),
            standard_deviation: extract_float_metric(insert_size_metrics, STANDARD_DEVIATION_NAME),
            read_pairs: extract_int_metric(insert_size_metrics, READ_PAIRS_NAME),
        }
    )
  end

  def coverage_viz_summary_s3_path
    return "#{postprocess_output_s3_path}/#{COVERAGE_VIZ_SUMMARY_JSON_NAME}" if pipeline_version_has_coverage_viz(pipeline_version)
  end

  def coverage_viz_data_s3_path(accession_id)
    "#{coverage_viz_output_s3_path}/#{accession_id}_coverage_viz.json" if pipeline_version_has_coverage_viz(pipeline_version)
  end

  def coverage_viz_output_s3_path
    "#{postprocess_output_s3_path}/coverage_viz"
  end

  def contigs_fasta_s3_path
    return "#{postprocess_output_s3_path}/#{ASSEMBLED_CONTIGS_NAME}" if supports_assembly?
  end

  def contigs_summary_s3_path
    return "#{postprocess_output_s3_path}/#{CONTIG_MAPPING_NAME}" if supports_assembly?
  end

  def annotated_fasta_s3_path
    return "#{postprocess_output_s3_path}/#{ASSEMBLY_PREFIX}#{DAG_ANNOTATED_FASTA_BASENAME}" if supports_assembly?
    return "#{postprocess_output_s3_path}/#{DAG_ANNOTATED_FASTA_BASENAME}" if pipeline_version_at_least_2(pipeline_version)

    multihit? ? "#{alignment_output_s3_path}/#{MULTIHIT_FASTA_BASENAME}" : "#{alignment_output_s3_path}/#{HIT_FASTA_BASENAME}"
  end

  def host_gene_count_s3_path
    return "#{host_filter_output_s3_path}/#{READS_PER_GENE_STAR_TAB_NAME}"
  end

  def nonhost_fastq_s3_paths
    input_file_ext = sample.fasta_input? ? 'fasta' : 'fastq'

    files = [
        "#{postprocess_output_s3_path}/nonhost_R1.#{input_file_ext}",
    ]

    if sample.input_files.length == 2
      files << "#{postprocess_output_s3_path}/nonhost_R2.#{input_file_ext}"
    end

    files
  end

  # Unidentified is also referred to as "unmapped"
  def unidentified_fasta_s3_path
    return "#{postprocess_output_s3_path}/#{ASSEMBLY_PREFIX}#{DAG_UNIDENTIFIED_FASTA_BASENAME}" if supports_assembly?
    return "#{output_s3_path_with_version}/#{DAG_UNIDENTIFIED_FASTA_BASENAME}" if pipeline_version_at_least_2(pipeline_version)
    "#{alignment_output_s3_path}/#{UNIDENTIFIED_FASTA_BASENAME}"
  end

  # This method exists to show exactly what host was subtracted in the run
  # according to the underlying dag_json during host filtering. A host other
  # than the sample host may have been subtracted for
  # two reasons:
  #
  # 1) there are no host genome files so we only subtract ERCCs
  # 2) the sample host or index files were changed after the run
  #
  # Note: This method returns a string identifier extracted from the index
  # filename, not a HostGenome instance, which could be ambiguous.
  def host_subtracted
    pipeline_run_stage = host_filtering_stage
    dag = pipeline_run_stage && pipeline_run_stage.dag_json && JSON.parse(pipeline_run_stage.dag_json)
    return nil unless dag
    # See app/lib/dags/host_filter.json.jbuilder for step definition
    host_filtering = dag["steps"].find { |step| step["class"] == "PipelineStepRunStar" }
    return nil unless host_filtering
    star_genome = host_filtering["additional_files"]["star_genome"]
    # Assumes stable URL structure. See HostGenome.rb.
    matches = star_genome.match(%r{s3://idseq-database/host_filter/(\w+)/})
    return nil unless matches
    return matches[1] # "ercc" for example
  end

  def get_lineage_json(ct2taxid, taxon_lineage_map)
    # Get the full lineage based on taxid
    # Sample output:
    # {"NT": [573,570,543,91347,1236,1224,-650,2, "Bacteria"],
    #  "NR": [573,570,543,91347,1236,1224,-650,2, "Bacteria"]}
    output = {}
    if ct2taxid
      ct2taxid.each { |count_type, taxid| output[count_type] = taxon_lineage_map[taxid.to_i] }
    end
    output
  end

  def get_m8_mapping(m8_file)
    m8_s3_path = "#{postprocess_output_s3_path}/#{m8_file}"
    m8_local_dir = "#{LOCAL_JSON_PATH}/#{id}"
    m8_local_path = PipelineRun.download_file_with_retries(m8_s3_path, m8_local_dir, 2)
    output = {}
    File.open(m8_local_path, 'r') do |m8f|
      line = m8f.gets
      while line
        fields = line.rstrip.split("\t")
        output[fields[0]] = fields
        line = m8f.gets
      end
    end
    output
  end

  # buffer can be a file or an array.
  def write_contig_mapping_table_csv(buffer)
    # If there are no contigs, return an empty file.
    if contigs.empty?
      return
    end
    nt_m8_map = get_m8_mapping(CONTIG_NT_TOP_M8)
    nr_m8_map = get_m8_mapping(CONTIG_NR_TOP_M8)
    header_row = ['contig_name', 'read_count', 'contig_length', 'contig_coverage']
    header_row += TaxonLineage.names_a.map { |name| "NT.#{name}" }
    header_row += M8_FIELDS_TO_EXTRACT.map { |idx| "NT.#{M8_FIELDS[idx]}" }
    header_row += TaxonLineage.names_a.map { |name| "NR.#{name}" }
    header_row += M8_FIELDS_TO_EXTRACT.map { |idx| "NR.#{M8_FIELDS[idx]}" }
    buffer << header_row
    contigs.each do |c|
      nt_m8 = nt_m8_map[c.name] || []
      nr_m8 = nr_m8_map[c.name] || []
      lineage = JSON.parse(c.lineage_json || "{}")
      row = [c.name, c.read_count]
      cfs = c.name.split("_")
      row += [cfs[3], cfs[5]]
      row += (lineage['NT'] || TaxonLineage.null_array)
      row += M8_FIELDS_TO_EXTRACT.map { |idx| nt_m8[idx] }
      row += (lineage['NR'] || TaxonLineage.null_array)
      row += M8_FIELDS_TO_EXTRACT.map { |idx| nr_m8[idx] }
      buffer << row
    end
  end

  def generate_contig_mapping_table_csv
    CSVSafe.generate(headers: true) do |csv|
      write_contig_mapping_table_csv(csv)
    end
  end

  def generate_contig_mapping_table_file
    # generate a csv file for contig mapping based on lineage_json and top m8
    local_file_name = "#{LOCAL_JSON_PATH}/#{CONTIG_MAPPING_NAME}#{id}"
    Open3.capture3("mkdir -p #{File.dirname(local_file_name)}")
    # s3_file_name = contigs_summary_s3_path # TODO(yf): might turn back for s3 generation later
    CSVSafe.open(local_file_name, 'w') do |writer|
      write_contig_mapping_table_csv(writer)
    end
    # Open3.capture3("aws s3 cp #{local_file_name} #{s3_file_name}")
    local_file_name
  end

  def db_load_contig_counts
    # Get contig2taxid
    contig_stats_s3_path = s3_file_for("contig_counts")
    downloaded_contig_counts = PipelineRun.download_file_with_retries(contig_stats_s3_path,
                                                                      LOCAL_JSON_PATH, 3)
    contig_counts_json = JSON.parse(File.read(downloaded_contig_counts))
    contig2taxid = {}
    contig_counts_json.each do |tax_entry|
      contig_list = tax_entry["contig_counts"]
      contig_list.each do |contig_name, _count|
        if tax_entry['tax_level'].to_i == TaxonCount:: TAX_LEVEL_SPECIES # species
          contig2taxid[contig_name] ||= {}
          contig2taxid[contig_name][tax_entry['count_type']] = tax_entry['taxid']
        end
      end
    end
    # Actually load contigs
    db_load_contigs(contig2taxid)
  end

  def db_load_contigs(contig2taxid)
    contig_stats_s3_path = s3_file_for("contigs")
    contig_s3_path = "#{postprocess_output_s3_path}/#{ASSEMBLED_CONTIGS_NAME}"

    downloaded_contig_stats = PipelineRun.download_file_with_retries(contig_stats_s3_path,
                                                                     LOCAL_JSON_PATH, 3)
    contig_stats_json = JSON.parse(File.read(downloaded_contig_stats))
    return if contig_stats_json.empty?

    contig_fasta = PipelineRun.download_file_with_retries(contig_s3_path, LOCAL_JSON_PATH, 3)
    contig_array = []
    taxid_list = []
    contig2taxid.values.each { |entry| taxid_list += entry.values }
    taxon_lineage_map = {}
    TaxonLineage.where(taxid: taxid_list.uniq).order(:id).each { |t| taxon_lineage_map[t.taxid.to_i] = t.to_a }

    # A lambda allows us to access variables in the enclosing scope, such as contig2taxid.
    get_contig_hash = lambda do |header, sequence|
      read_count = contig_stats_json[header] || 0
      lineage_json = get_lineage_json(contig2taxid[header], taxon_lineage_map)
      species_taxid_nt = lineage_json.dig("NT", 0) || nil
      species_taxid_nr = lineage_json.dig("NR", 0) || nil
      genus_taxid_nt = lineage_json.dig("NT", 1) || nil
      genus_taxid_nr = lineage_json.dig("NR", 1) || nil

      {
          name: header, sequence: sequence, read_count: read_count, lineage_json: lineage_json.to_json,
          species_taxid_nt: species_taxid_nt, species_taxid_nr: species_taxid_nr,
          genus_taxid_nt: genus_taxid_nt, genus_taxid_nr: genus_taxid_nr,
      }
    end

    File.open(contig_fasta, 'r') do |cf|
      line = cf.gets
      header = ''
      sequence = ''
      while line
        if line[0] == '>'
          contig_hash = get_contig_hash.call(header, sequence)
          if contig_hash[:read_count] >= MIN_CONTIG_READS && header != ''
            contig_array << contig_hash
          end
          header = line[1..line.size].rstrip
          sequence = ''
        else
          sequence += line
        end
        line = cf.gets
      end
      contig_hash = get_contig_hash.call(header, sequence)
      if contig_hash[:read_count] >= MIN_CONTIG_READS
        contig_array << contig_hash
      end
    end
    update(contigs_attributes: contig_array) unless contig_array.empty?
    update(assembled: 1)
  end

  def db_load_amr_counts
    amr_results = PipelineRun.download_file(s3_file_for("amr_counts"), local_amr_full_results_path)
    if amr_results.nil?
      Rails.logger.error("No AMR results file found for PipelineRun ##{id}. Is the pipeline okay?")
      return
    end
    amr_counts_array = []
    amr_counts_keys = [:gene, :allele, :coverage, :depth, :drug_family, :total_reads, :rpm, :dpm]
    amr_results_keys = %w[gene allele coverage depth gene_family total_reads rpm dpm]
    # results can be as small as ~80 bytes, so play it safe; empty results are 1 byte files
    unless File.size?(amr_results) < 10
      amr_results_table = CSV.read(amr_results, headers: true)
      amr_results_table.each do |row|
        amr_count_for_gene = {}
        amr_counts_keys.each_with_index do |counts_key, index|
          result_value = row[amr_results_keys[index]]
          if result_value.present?
            amr_count_for_gene[counts_key] = result_value
          end
        end
        if row["annotation"].present?
          split_annotation = row["annotation"].split(";")
          if split_annotation.length >= 5
            amr_count_for_gene[:annotation_gene] = split_annotation[2]
            amr_count_for_gene[:genbank_accession] = split_annotation[4]
          end
        end
        amr_counts_array << amr_count_for_gene
      end
    end
    update(amr_counts_attributes: amr_counts_array)
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

  def load_taxons(downloaded_json_path, refined = false)
    json_dict = JSON.parse(File.read(downloaded_json_path))
    taxon_counts_attributes = json_dict.dig('pipeline_output', 'taxon_counts_attributes')

    # check if there's any record loaded into taxon_counts. If so, skip
    check_count_type = refined ? 'NT+' : 'NT'
    loaded_records = TaxonCount.where(pipeline_run_id: id)
                         .where(count_type: check_count_type).count
    return if loaded_records > 0

    # only keep counts at certain taxonomic levels
    acceptable_tax_levels = [TaxonCount::TAX_LEVEL_SPECIES]
    acceptable_tax_levels << TaxonCount::TAX_LEVEL_GENUS if multihit?
    acceptable_tax_levels << TaxonCount::TAX_LEVEL_FAMILY if multihit?
    taxon_counts_attributes_filtered = taxon_counts_attributes.select do |tcnt|
      # TODO:  Better family support.
      acceptable_tax_levels.include?(tcnt['tax_level'].to_i) && !invalid_family_call?(tcnt)
    end
    # Set created_at and updated_at
    current_time = Time.now.utc # to match TaxonLineage date range comparison
    tcnt_attrs_to_merge = {
        'created_at' => current_time,
        'updated_at' => current_time,
        'pipeline_run_id' => id,
    }
    taxon_counts_attributes_filtered.each do |tcnt|
      tcnt["count_type"] += "+" if refined
      tcnt.merge!(tcnt_attrs_to_merge)
    end
    TaxonCount.import!(taxon_counts_attributes_filtered)

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
    _stdout, _stderr, _status = Open3.capture3("rm", "-f", downloaded_json_path)
  end

  def db_load_taxon_counts
    output_json_s3_path = s3_file_for("taxon_counts")
    downloaded_json_path = PipelineRun.download_file_with_retries(output_json_s3_path,
                                                                  local_json_path, 3)
    LogUtil.log_err_and_airbrake("PipelineRun #{id} failed taxon_counts download") unless downloaded_json_path
    return unless downloaded_json_path
    load_taxons(downloaded_json_path, false)
  end

  def db_load_byteranges
    byteranges_json_s3_path = s3_file_for("taxon_byteranges")
    downloaded_byteranges_path = PipelineRun.download_file(byteranges_json_s3_path, local_json_path)
    taxon_byteranges_csv_file = "#{local_json_path}/taxon_byteranges"
    hash_array_json2csv(downloaded_byteranges_path, taxon_byteranges_csv_file, %w[taxid hit_type first_byte last_byte])

    Syscall.run_in_dir(local_json_path, "sed", "-e", "s/$/,#{id}/", "-i", "taxon_byteranges")
    success = Syscall.run_in_dir(local_json_path, "mysqlimport --user=$DB_USERNAME --host=#{rds_host} --password=$DB_PASSWORD --fields-terminated-by=',' --replace --local --columns=taxid,hit_type,first_byte,last_byte,pipeline_run_id idseq_#{Rails.env} taxon_byteranges")
    LogUtil.log_err_and_airbrake("PipelineRun #{id} failed db_load_byteranges import") unless success
    Syscall.run("rm", "-f", downloaded_byteranges_path)
  end

  def s3_file_for(output)
    # This function assumes that pipeline_version has been set and is assembly-enabled (>=3.1) for
    # taxon_counts/taxon_byteranges/contigs/contig_counts.
    unless pipeline_version.present? || finalized
      # No need to warn if finalized (likely failed)
      LogUtil.log_err_and_airbrake("s3_file_for was called without a pipeline_version for PR #{id}")
    end

    case output
    when "ercc_counts"
      "#{host_filter_output_s3_path}/#{ERCC_OUTPUT_NAME}"
    when "amr_counts"
      "#{postprocess_output_s3_path}/#{AMR_FULL_RESULTS_NAME}"
    when "taxon_counts"
      "#{postprocess_output_s3_path}/#{REFINED_TAXON_COUNTS_JSON_NAME}"
    when "taxon_byteranges"
      "#{postprocess_output_s3_path}/#{REFINED_TAXID_BYTERANGE_JSON_NAME}"
    when "contigs"
      "#{postprocess_output_s3_path}/#{ASSEMBLED_STATS_NAME}"
    when "contig_counts"
      "#{postprocess_output_s3_path}/#{CONTIG_SUMMARY_JSON_NAME}"
    when "insert_size_metrics"
      "#{host_filter_output_s3_path}/#{INSERT_SIZE_METRICS_OUTPUT_NAME}"
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
    return "COMPLETE - ISSUE" if known_user_error
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
    return unless [STATUS_UNKNOWN, STATUS_LOADING_ERROR].include?(state)
    if output_ready?(output)
      output_state.update(state: STATUS_LOADING_QUEUED)
      Resque.enqueue(ResultMonitorLoader, id, output)
      # check if job is done more than a minute ago
    elsif finalized? && pipeline_run_stages.order(:step_number).last.updated_at < 1.minute.ago
      checker = CHECKERS_BY_OUTPUT[output_state.output]
      # If there is no checker, the file should have been generated
      # If there is a checker use it to check if the file should have been generated
      should_have_been_generated = !checker || send(checker)
      if should_have_been_generated
        output_state.update(state: STATUS_FAILED)
      else
        output_state.update(state: STATUS_LOADED)
      end
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
    output_states.pluck(:state).all? { |s| [STATUS_LOADED, STATUS_FAILED].include?(s) }
  end

  def all_output_states_loaded?
    output_states.pluck(:state).all? { |s| s == STATUS_LOADED }
  end

  def monitor_results
    return if results_finalized?

    compiling_stats_failed = false

    # Get pipeline_version, which determines S3 locations of output files.
    # If pipeline version is not present, we cannot load results yet.
    # Except, if the pipeline run is finalized, we have to (this is a failure case).
    update_pipeline_version(self, :pipeline_version, pipeline_version_file) if pipeline_version.blank?
    return if pipeline_version.blank? && !finalized

    # Load any new outputs that have become available:
    output_states.each do |o|
      check_and_enqueue(o)
    end

    # Update job stats:
    begin
      # TODO:  Make this less expensive while jobs are running, perhaps by doing it only sometimes, then again at end.
      # TODO:  S3 is a middleman between these two functions;  load_stats shouldn't wait for S3
      # TODO: (gdingle): compile_stats_file! will fetch s3 files 100s of times unnecessarily in a typical run.
      # See https://jira.czi.team/browse/IDSEQ-1924.
      compile_stats_file!
      load_stats_file
      load_chunk_stats
    rescue
      # TODO: Log this exception
      compiling_stats_failed = true
    end

    # Check if run is complete:
    if all_output_states_terminal?

      if all_output_states_loaded? && !compiling_stats_failed
        update(results_finalized: FINALIZED_SUCCESS)

        # Precache reports for all backgrounds.
        if ready_for_cache?
          Resque.enqueue(PrecacheReportInfo, id)
        else
          MetricUtil.put_metric_now("samples.cache.not_precached", 1, ["pipeline_run_id:#{id}"])
        end

        # Send to Datadog and Segment
        tags = ["sample_id:#{sample.id}"]
        # DEPRECATED. Use log_analytics_event.
        MetricUtil.put_metric_now("samples.succeeded.run_time", run_time, tags, "gauge")
        event = MetricUtil::ANALYTICS_EVENT_NAMES[:pipeline_run_succeeded]
      else
        update(results_finalized: FINALIZED_FAIL)
        event = MetricUtil::ANALYTICS_EVENT_NAMES[:pipeline_run_failed]
      end

      MetricUtil.log_analytics_event(
          event,
          sample.user,
          pipeline_run_id: id, project_id: sample.project.id, run_time: run_time
      )
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
    _stdout = Syscall.run("rm", "-f", downloaded_stats_path)
  end

  def update_job_status
    automatic_restart = false
    prs = active_stage
    if prs.nil?
      # all stages succeeded
      self.finalized = 1
      self.job_status = STATUS_CHECKED
    else
      if prs.failed?
        self.job_status = STATUS_FAILED
        self.finalized = 1
        self.known_user_error, self.error_message = check_for_user_error(prs)
        automatic_restart = automatic_restart_allowed? unless known_user_error
        send_to_airbrake = !known_user_error
        report_failed_pipeline_run_stage(prs, automatic_restart, known_user_error, send_to_airbrake)
      elsif !prs.started?
        # we're moving on to a new stage
        prs.run_job
      else
        # still running
        prs.update_job_status
        # Check for long-running pipeline run and log/alert if needed
        check_and_log_long_run
      end
      self.job_status = "#{prs.step_number}.#{prs.name}-#{prs.job_status}"
      self.job_status += "|#{STATUS_READY}" if report_ready?
    end
    save!
    enqueue_new_pipeline_run if automatic_restart
  end

  private def pipeline_run_stage_error_message(prs, automatic_restart, known_user_error)
    reads_remaining_text = adjusted_remaining_reads ? "with #{adjusted_remaining_reads} reads remaining " : ""
    automatic_restart_text = automatic_restart ? "Automatic restart is being triggered. " : "** Manual action required **. "
    known_user_error = known_user_error ? "Known user error #{known_user_error}. " : ""

    "[Datadog] SampleFailedEvent: Sample #{sample.id} by #{sample.user.role_name} failed #{prs.step_number}-#{prs.name} #{reads_remaining_text}" \
      "after #{duration_hrs} hours. #{automatic_restart_text}#{known_user_error}"\
      "See: #{status_url}"
  end

  private def report_failed_pipeline_run_stage(prs, automatic_restart, known_user_error, send_to_airbrake)
    log_message = pipeline_run_stage_error_message(prs, automatic_restart, known_user_error)
    if send_to_airbrake
      LogUtil.log_err_and_airbrake(log_message)
    else
      Rails.logger.warn(log_message)
    end
    tags = ["sample_id:#{sample.id}", "automatic_restart:#{automatic_restart}", "known_user_error:#{known_user_error ? true : false}", "send_to_airbrake:#{send_to_airbrake}"]
    MetricUtil.put_metric_now("samples.failed", 1, tags)
  end

  def automatic_restart_allowed?
    (pipeline_branch.nil? || pipeline_branch == "master") \
    && AppConfigHelper.get_json_app_config(AppConfig::AUTO_RESTART_ALLOWED_STAGES, []).include?(active_stage&.step_number) \
    && previous_pipeline_runs_same_version.to_a.none?(&:failed?)
  end

  def previous_pipeline_runs_same_version
    sample.pipeline_runs
        .where.not(id: id)
        .where(pipeline_version: pipeline_version)
  end

  def enqueue_new_pipeline_run
    Resque.enqueue(RestartPipelineForSample, sample.id)
  end

  def job_status_display
    return "Pipeline Initializing" unless self.job_status
    stage = self.job_status.to_s.split("-")[0].split(".")[1]
    stage ? "Running #{stage}" : self.job_status
  end

  def run_time
    Time.now.utc - created_at
  end

  def duration_hrs
    (run_time / 60 / 60).round(2)
  end

  def check_and_log_long_run
    # Check for long-running pipeline runs and log/alert if needed:
    tags = ["sample_id:#{sample.id}"]
    # DEPRECATED. Use log_analytics_event.
    MetricUtil.put_metric_now("samples.running.run_time", run_time, tags, "gauge")

    if alert_sent.zero?
      # NOTE (2019-08-02): Based on the last 3000 successful samples, only 0.17% took longer than 12 hours.
      threshold = 12.hours
      if run_time > threshold
        msg = "[Datadog] LongRunningSampleEvent: Sample #{sample.id} by #{sample.user.role_name} has been running #{duration_hrs} hours. #{job_status_display} " \
          "See: #{status_url}"
        LogUtil.log_err_and_airbrake(msg)
        update(alert_sent: 1)
      end
    end
  end

  def load_chunk_stats
    stdout = Syscall.run("aws", "s3", "ls", "#{output_s3_path_with_version}/chunks/")
    return unless stdout
    outputs = stdout.split("\n").map { |line| line.split.last }
    gsnap_outputs = outputs.select { |file_name| file_name.start_with?("multihit-gsnap-out") && file_name.end_with?(".m8") }
    rapsearch_outputs = outputs.select { |file_name| file_name.start_with?("multihit-rapsearch2-out") && file_name.end_with?(".m8") }
    self.completed_gsnap_chunks = gsnap_outputs.length
    self.completed_rapsearch_chunks = rapsearch_outputs.length
    save
  end

  # Generate stats.json from all *.count files in results dir. Example:
  # [
  #   {
  #     "reads_after": 8262,
  #     "task": "unidentified_fasta"
  #   },
  #   {
  #     "reads_after": 8558,
  #     "task": "bowtie2_out"
  #   },
  #   ...
  #   {
  #     "total_reads": 10000
  #   },
  #   {
  #     "fraction_subsampled": 1.0
  #   },
  #   {
  #     "adjusted_remaining_reads": 8558
  #   }
  # ]
  #
  # IMPORTANT NOTE: This method ALSO sets attributes of pipeline run instance.
  # For unmapped_reads, it will read a .count file from /postprocess s3 dir.
  def compile_stats_file!
    res_folder = output_s3_path_with_version
    stdout, _stderr, status = Open3.capture3("aws s3 ls #{res_folder}/ | grep count$")
    unless status.exitstatus.zero?
      return
    end

    all_counts = []
    stdout.split("\n").each do |line|
      fname = line.split(" ")[3] # Last col in line
      contents = Syscall.s3_read_json("#{res_folder}/#{fname}")
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
      frac = sub_before[:reads_after] > 0 ? ((1.0 * sub_after[:reads_after]) / sub_before[:reads_after]) : 1.0
      all_counts << { fraction_subsampled: frac }
      self.fraction_subsampled = frac
    end

    # Load remaining reads
    # This is an approximation multiplied by the subsampled ratio so that it
    # can be compared to total reads for the user. Number of reads after host
    # filtering step vs. total reads as if subsampling had never occurred.
    rem = all_counts.detect { |entry| entry.value?("gsnap_filter_out") }
    if rem && frac > 0
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
    self.unmapped_reads = fetch_unmapped_reads(all_counts) || unmapped_reads

    # Write JSON to a file
    tmp = Tempfile.new
    tmp.write(all_counts.to_json)
    tmp.close

    # Copy to S3. Overwrite if exists.
    _stdout, stderr, status = Open3.capture3("aws s3 cp #{tmp.path} #{res_folder}/#{STATS_JSON_NAME}")
    unless status.exitstatus.zero?
      Rails.logger.warn("Failed to write compiled stats file: #{stderr}")
    end

    save
  end

  # Fetch the unmapped reads count from alignment stage then refined counts from
  # assembly stage, as each becomes available. Prior to Dec 2019, the count was
  # only fetched from alignment.
  def fetch_unmapped_reads(
      all_counts,
      s3_path = "#{postprocess_output_s3_path}/#{DAG_ANNOTATED_COUNT_BASENAME}"
  )
    unmapped_reads = nil
    unidentified = all_counts.detect { |entry| entry.value?("unidentified_fasta") }
    if unidentified
      unmapped_reads = unidentified[:reads_after]

      # This will fetch unconditionally on every iteration of the results
      # monitor. My attempts to restrict fetching with "finalized?" and
      # "step_number == 3" both failed to work in production.
      if supports_assembly?
        # see idseq_dag/steps/generate_annotated_fasta.py
        begin
          Rails.logger.info("Fetching file: #{s3_path}")
          refined_annotated_out = Syscall.s3_read_json(s3_path)
          unmapped_reads = refined_annotated_out["unidentified_fasta"]
        rescue
          Rails.logger.warn("Could not read file: #{s3_path}")
        end
      end
    end
    unmapped_reads
  end

  def local_json_path
    "#{LOCAL_JSON_PATH}/#{id}"
  end

  def local_amr_full_results_path
    "#{LOCAL_AMR_FULL_RESULTS_PATH}/#{id}"
  end

  def local_amr_drug_summary_path
    "#{LOCAL_AMR_DRUG_SUMMARY_PATH}/#{id}"
  end

  def self.download_file_with_retries(s3_path, destination, max_tries, dest_is_dir = true)
    round = 0
    while round < max_tries
      downloaded = PipelineRun.download_file(s3_path, destination, dest_is_dir)
      return downloaded if downloaded
      round += 1
      sleep(15)
    end
  end

  def self.download_file(s3_path, destination, dest_is_dir = true)
    # If the destination path is a directory, create the directory if necessary and append the file name to the end of the destination path.
    # If the destination path is a file name, assume that the parent directories already exist.
    Syscall.run("mkdir", "-p", destination) if dest_is_dir
    destination_path = dest_is_dir ? "#{destination}/#{File.basename(s3_path)}" : destination
    success = Syscall.s3_cp(s3_path, destination_path)
    if success
      return destination_path
    else
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
    lineage_version = alignment_config.lineage_version
    TaxonCount.connection.execute(
        "REPLACE INTO taxon_counts(pipeline_run_id, tax_id, name,
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
       WHERE (#{lineage_version} BETWEEN taxon_lineages.version_start AND taxon_lineages.version_end) AND
             taxon_lineages.taxid = taxon_counts.tax_id AND
             taxon_counts.pipeline_run_id = #{id} AND
             taxon_counts.tax_level = #{TaxonCount::TAX_LEVEL_SPECIES}
      GROUP BY 1,2,3,4,5"
    )
  end

  def update_names
    # The names from the taxon_lineages table are preferred, but, not always
    # available;  this code merges them into taxon_counts.name.
    lineage_version = alignment_config.lineage_version
    %w[species genus family].each do |level|
      level_id = ActiveRecord::Base.connection.quote(TaxonCount::NAME_2_LEVEL[level])
      TaxonCount.connection.execute("
        UPDATE taxon_counts, taxon_lineages
        SET taxon_counts.name = taxon_lineages.#{level}_name,
            taxon_counts.common_name = taxon_lineages.#{level}_common_name
        WHERE taxon_counts.pipeline_run_id=#{id} AND
              taxon_counts.tax_level=#{level_id} AND
              taxon_counts.tax_id = taxon_lineages.taxid AND
              (#{lineage_version} BETWEEN taxon_lineages.version_start AND taxon_lineages.version_end) AND
              taxon_lineages.#{level}_name IS NOT NULL
      ")
    end
  end

  def update_genera
    lineage_version = alignment_config.lineage_version
    TaxonCount.connection.execute("
      UPDATE taxon_counts, taxon_lineages
      SET taxon_counts.genus_taxid = taxon_lineages.genus_taxid,
          taxon_counts.family_taxid = taxon_lineages.family_taxid,
          taxon_counts.superkingdom_taxid = taxon_lineages.superkingdom_taxid
      WHERE taxon_counts.pipeline_run_id=#{id} AND
            (#{lineage_version} BETWEEN taxon_lineages.version_start AND taxon_lineages.version_end) AND
            taxon_lineages.taxid = taxon_counts.tax_id
    ")
  end

  def update_superkingdoms
    lineage_version = alignment_config.lineage_version
    TaxonCount.connection.execute("
      UPDATE taxon_counts, taxon_lineages
      SET taxon_counts.superkingdom_taxid = taxon_lineages.superkingdom_taxid
      WHERE taxon_counts.pipeline_run_id=#{id}
            AND (#{lineage_version} BETWEEN taxon_lineages.version_start AND taxon_lineages.version_end)
            AND taxon_counts.tax_id > #{TaxonLineage::INVALID_CALL_BASE_ID}
            AND taxon_lineages.taxid = taxon_counts.tax_id
    ")
    TaxonCount.connection.execute("
      UPDATE taxon_counts, taxon_lineages
      SET taxon_counts.superkingdom_taxid = taxon_lineages.superkingdom_taxid
      WHERE taxon_counts.pipeline_run_id=#{id}
            AND (#{lineage_version} BETWEEN taxon_lineages.version_start AND taxon_lineages.version_end)
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
    phage_taxids = TaxonLineage::PHAGE_TAXIDS.join(",")
    TaxonCount.connection.execute("
      UPDATE taxon_counts
      SET is_phage = 1
      WHERE pipeline_run_id=#{id} AND
            tax_id IN (#{phage_taxids})
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
      @cached_subsample_fraction ||= adjusted_remaining_reads > 0 ? ((1.0 * subsampled_reads) / adjusted_remaining_reads) : 1.0
    end
  end

  def subsample_suffix
    if pipeline_version_at_least_2(pipeline_version)
      # New dag pipeline. no subsample folder
      return nil
    end
    all_suffix = pipeline_version ? "subsample_all" : ""
    subsample? ? "subsample_#{subsample}" : all_suffix
  end

  delegate :sample_output_s3_path, to: :sample

  # TODO: Refactor: "alignment_output_s3_path, postprocess_output_s3_path and
  # now expt_output_s3_path all contain essentially the same code.
  # So you could make a helper function to which you would pass
  #  sample.sample_expt_s3_path as an argument" (Charles)
  def expt_output_s3_path
    # TODO: deprecate this function. no need for a separate dir for exp results.
    pipeline_ver_str = ""
    pipeline_ver_str = "#{pipeline_version}/" if pipeline_version
    result = "#{sample.sample_expt_s3_path}/#{pipeline_ver_str}#{subsample_suffix}"
    result.chomp("/")
  end

  def postprocess_output_s3_path
    pipeline_ver_str = ""
    pipeline_ver_str = "#{pipeline_version}/" if pipeline_version
    result = "#{sample.sample_postprocess_s3_path}/#{pipeline_ver_str}#{subsample_suffix}"
    result.chomp("/")
  end

  def alignment_viz_json_s3(taxon_info)
    # taxon_info example: 'nt.species.573'
    "#{alignment_viz_output_s3_path}/#{taxon_info}.align_viz.json"
  end

  def alignment_viz_output_s3_path
    "#{postprocess_output_s3_path}/align_viz"
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
    file_prefix = ''
    file_prefix = ASSEMBLY_PREFIX if supports_assembly?
    # by tax_level and hit_type
    { TaxonCount::TAX_LEVEL_SPECIES => {
        'NT' => "#{postprocess_output_s3_path}/#{file_prefix}#{SORTED_TAXID_ANNOTATED_FASTA}",
        'NR' => "#{postprocess_output_s3_path}/#{file_prefix}#{SORTED_TAXID_ANNOTATED_FASTA_NR}",
    },
      TaxonCount::TAX_LEVEL_GENUS => {
          'NT' => "#{postprocess_output_s3_path}/#{file_prefix}#{SORTED_TAXID_ANNOTATED_FASTA_GENUS_NT}",
          'NR' => "#{postprocess_output_s3_path}/#{file_prefix}#{SORTED_TAXID_ANNOTATED_FASTA_GENUS_NR}",
      },
      TaxonCount::TAX_LEVEL_FAMILY => {
          'NT' => "#{postprocess_output_s3_path}/#{file_prefix}#{SORTED_TAXID_ANNOTATED_FASTA_FAMILY_NT}",
          'NR' => "#{postprocess_output_s3_path}/#{file_prefix}#{SORTED_TAXID_ANNOTATED_FASTA_FAMILY_NR}",
      }, }
  end

  def pipeline_version_file
    "#{sample.sample_output_s3_path}/#{PIPELINE_VERSION_FILE}"
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

  def contig_lineages(min_contig_reads = MIN_CONTIG_READS)
    contigs.select("id, read_count, lineage_json")
        .where("read_count >= ?", min_contig_reads)
        .where("lineage_json IS NOT NULL")
  end

  def get_contigs_for_taxid(taxid, min_contig_reads = MIN_CONTIG_READS)
    contig_ids = []
    contig_lineages(min_contig_reads).each do |c|
      lineage = JSON.parse(c.lineage_json)
      contig_ids << c.id if lineage.values.flatten.include?(taxid)
    end

    contigs.where(id: contig_ids).order("read_count DESC")
  end

  def get_summary_contig_counts(min_contig_reads)
    summary_dict = {} # key: count_type:taxid , value: contigs, contig_reads
    contig_lineages(min_contig_reads).each do |c|
      lineage = JSON.parse(c.lineage_json)
      lineage.each do |count_type, taxid_arr|
        taxids = taxid_arr[0..1]
        taxids.each do |taxid|
          dict_key = "#{count_type}:#{taxid}"
          summary_dict[dict_key] ||= { contigs: 0, contig_reads: 0 }
          summary_dict[dict_key][:contigs] += 1
          summary_dict[dict_key][:contig_reads] += c.read_count
        end
      end
    end
    output = []
    summary_dict.each do |dict_key, info|
      count_type, taxid = dict_key.split(':')
      info[:count_type] = count_type
      info[:taxid] = taxid.to_i
      output << info
    end
    output
  end

  def get_summary_contig_counts_v2(min_contig_reads)
    # Stores the number of contigs that match a given taxid, count_type (nt or nr), and read_count (number of reads aligned to that contig).
    # Create and store default values for the hash if the key doesn't exist yet
    summary_dict = Hash.new do |summary, taxid|
      summary[taxid] = Hash.new do |taxid_hash, count_type| # rubocop forces different variable names
        taxid_hash[count_type] = Hash.new do |count_type_hash, read_count|
          count_type_hash[read_count] = 0
        end
      end
    end
    contig_taxids = contigs.where("read_count >= ?", min_contig_reads)
                        .where("lineage_json IS NOT NULL")
                        .pluck("read_count, species_taxid_nt, species_taxid_nr, genus_taxid_nt, genus_taxid_nr")
    contig_taxids.each do |c|
      read_count, species_taxid_nt, species_taxid_nr, genus_taxid_nt, genus_taxid_nr = c

      summary_dict[species_taxid_nt]["nt"][read_count] += 1 if species_taxid_nt
      summary_dict[species_taxid_nr]["nr"][read_count] += 1 if species_taxid_nr
      summary_dict[genus_taxid_nt]["nt"][read_count] += 1 if genus_taxid_nt
      summary_dict[genus_taxid_nr]["nr"][read_count] += 1 if genus_taxid_nr
    end
    return summary_dict
  end

  def get_taxid_list_with_contigs(min_contig_reads = MIN_CONTIG_READS)
    taxid_list = []
    contig_lineages(min_contig_reads).each do |c|
      lineage = JSON.parse(c.lineage_json)
      lineage.values.each { |taxid_arr| taxid_list += taxid_arr[0..1] }
    end
    taxid_list.uniq
  end

  def alignment_output_s3_path
    pipeline_ver_str = ""
    pipeline_ver_str = "#{pipeline_version}/" if pipeline_version
    result = "#{sample.sample_output_s3_path}/#{pipeline_ver_str}#{subsample_suffix}"
    result.chomp("/")
  end

  delegate :project_id, to: :sample

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
          expected: baseline[:concentration_in_mix_1_attomolesul],
      }
    end
    ret
  end

  def step_statuses_by_stage
    pipeline_run_stages.map(&:step_statuses)
  end

  def outputs_by_step(can_see_stage1_results = false)
    # Get map of s3 path to presigned URL and size.
    filename_to_info = {}
    sample.results_folder_files(pipeline_version).each do |entry|
      filename_to_info[entry[:key]] = entry
    end
    # Get read counts
    job_stats_by_task = job_stats.index_by(&:task)
    # Get outputs and descriptions by target.
    result = {}
    pipeline_run_stages.each_with_index do |prs, stage_idx|
      next unless prs.dag_json && STEP_DESCRIPTIONS[prs.name]
      result[prs.name] = {
          "stage_description" => STEP_DESCRIPTIONS[prs.name]["stage"],
          "stage_dag_json" => prs.redacted_dag_json,
          "steps" => {},
      }
      dag_dict = JSON.parse(prs.dag_json)
      output_dir_s3_key = dag_dict["output_dir_s3"].chomp("/").split("/", 4)[3] # keep everything after bucket name, except trailing '/'
      targets = dag_dict["targets"]
      given_targets = dag_dict["given_targets"]
      num_steps = targets.length
      # Fetch step statuses for this stage
      #   do it before the loop because step_statuses is expensive
      step_statuses = prs.step_statuses
      targets.each_with_index do |(target_name, output_list), step_idx|
        next if given_targets.keys.include?(target_name)

        file_paths = []
        output_list.each do |output|
          file_paths << "#{output_dir_s3_key}/#{pipeline_version}/#{output}"
        end

        get_additional_outputs(step_statuses, target_name).each do |filename|
          file_paths << "#{output_dir_s3_key}/#{pipeline_version}/#{filename}"
        end

        file_info = []
        file_paths.each do |path|
          file_info_for_output = filename_to_info[path]
          next unless file_info_for_output
          if !can_see_stage1_results && stage_idx.zero? && step_idx < num_steps - 1
            # Delete URLs for all host-filtering outputs but the last, unless user uploaded the sample.
            file_info_for_output["url"] = nil
          end
          file_info << file_info_for_output
        end

        result[prs.name]["steps"][target_name] = {
            "step_description" => STEP_DESCRIPTIONS[prs.name]["steps"][target_name],
            "file_list" => file_info,
            "reads_after" => (job_stats_by_task[target_name] || {})["reads_after"],
        }
      end
    end
    result
  end

  def self.viewable(user)
    where(sample_id: Sample.viewable(user).pluck(:id))
  end

  # Keys here are used as cache keys for report_info action in SamplesController.
  # The values here are used as defaults for PipelineSampleReport.jsx.
  def report_info_params
    {
        pipeline_version: pipeline_version || PipelineRun::PIPELINE_VERSION_WHEN_NULL,
        # background should be set by caller
        background_id: nil,
        pipeline_run_id: id,
        # For invalidation if underlying data changes. This should only happen in
        # exceptional situations, such as manual DB edits.
        report_ts: max_updated_at.utc.beginning_of_day.to_i,
        format: "json",
    }
  end

  # Gets last update time of all has_many relations and current pipeline run
  def max_updated_at
    assocs = PipelineRun.reflect_on_all_associations(:has_many)
    assocs_max = assocs.map { |assoc| send(assoc.name).maximum(:updated_at) }
    [updated_at, assocs_max.compact.max].compact.max
  end

  # This precaches reports for a selection of backgrounds (see Background:top_for_sample).
  def precache_report_info!
    params = report_info_params
    Background.top_for_sample(sample).pluck(:id).each do |background_id|
      cache_key = PipelineReportService.report_info_cache_key(
          "/samples/#{sample.id}/report_v2.json",
          params.merge(background_id: background_id)
      )
      Rails.logger.info("Precaching #{cache_key} with background #{background_id}")
      Rails.cache.fetch(cache_key, expires_in: 30.days) do
        PipelineReportService.call(self, background_id)
      end

      MetricUtil.log_analytics_event("PipelineReport_precached", nil)
    end
  end

  def rpm(raw_read_count)
    raw_read_count / ((total_reads - total_ercc_reads.to_i) * subsample_fraction) * 1_000_000.0
  end

  def alignment_db
    alignment_config.name
  end

  private def supports_assembly?
    pipeline_version_has_assembly(pipeline_version)
  end
end