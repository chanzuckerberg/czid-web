# * A PipelineRun represents one run or execution of the mngs pipeline for a
#   sample. It was created to make rerunning samples easier with
#   inputs/outputs/versions of each run. All the mngs run outputs should belong
#   to the PipelineRun (e.g. taxon counts, contigs, stats, etc).
# * PipelineRunStages (Host Filtering, Alignment, Post Processing, and
#   Experimental) were further added to organize large chunks of the sample
#   processing within a PipelineRun.
# * OutputStates were added to represent the status of various outputs that the
#   server expects to load after pipeline execution.

require 'open3'
require 'json'
require 'csv'

class PipelineRun < ApplicationRecord
  include ApplicationHelper
  include PipelineOutputsHelper
  include PipelineRunsHelper
  include StringUtil

  belongs_to :sample
  belongs_to :alignment_config
  has_many :annotations, dependent: :destroy
  has_many :pipeline_run_stages, dependent: :destroy
  accepts_nested_attributes_for :pipeline_run_stages
  has_and_belongs_to_many :backgrounds
  has_and_belongs_to_many :phylo_trees
  has_and_belongs_to_many :phylo_tree_ngs
  has_and_belongs_to_many :bulk_downloads

  has_many :output_states, dependent: :destroy
  has_many :taxon_counts, dependent: :destroy
  has_many :job_stats, dependent: :destroy
  has_many :taxon_byteranges, dependent: :destroy
  has_many :ercc_counts, dependent: :destroy
  has_many :amr_counts, dependent: :destroy
  has_many :contigs, dependent: :destroy
  has_many :accession_coverage_stats, dependent: :destroy
  has_one :insert_size_metric_set, dependent: :destroy
  accepts_nested_attributes_for :taxon_counts
  accepts_nested_attributes_for :job_stats
  accepts_nested_attributes_for :taxon_byteranges
  accepts_nested_attributes_for :ercc_counts
  accepts_nested_attributes_for :amr_counts
  accepts_nested_attributes_for :contigs
  accepts_nested_attributes_for :accession_coverage_stats
  accepts_nested_attributes_for :insert_size_metric_set

  TECHNOLOGY_INPUT = {
    illumina: "Illumina",
    nanopore: "ONT",
  }.freeze
  validates :technology, presence: true, inclusion: { in: TECHNOLOGY_INPUT.values }

  # Mapping the technology input to the outputs produced by the pipeline.
  TARGET_OUTPUTS = {
    TECHNOLOGY_INPUT[:illumina] => %w[ercc_counts taxon_counts contig_counts taxon_byteranges insert_size_metrics accession_coverage_stats],
    TECHNOLOGY_INPUT[:nanopore] => %w[taxon_counts contig_counts taxon_byteranges accession_coverage_stats],
  }.freeze

  DEFAULT_SUBSAMPLING = 1_000_000 # number of fragments to subsample to, after host filtering
  DEFAULT_MAX_INPUT_FRAGMENTS = 75_000_000 # max fragments going into the pipeline
  ADAPTER_SEQUENCES = { "single-end" => "s3://#{S3_DATABASE_BUCKET}/adapter_sequences/illumina_TruSeq3-SE.fasta",
                        "paired-end" => "s3://#{S3_DATABASE_BUCKET}/adapter_sequences/illumina_TruSeq3-PE-2_NexteraPE-PE.fasta", }.freeze

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
  # CDHITDUP_HIT_FASTA_BASENAME is required for backwards compatibility
  CDHITDUP_HIT_FASTA_BASENAME = 'taxids.rapsearch2.filter.deuterostomes.taxids.gsnapl.unmapped.bowtie2.lzw.cdhitdup.priceseqfilter.unmapped.star.fasta'.freeze
  HIT_FASTA_BASENAME = 'taxids.rapsearch2.filter.deuterostomes.taxids.gsnapl.unmapped.bowtie2.lzw.czid_dedup.priceseqfilter.unmapped.star.fasta'.freeze

  PIPELINE_VERSION_FILE = "pipeline_version.txt".freeze
  STATS_JSON_NAME = "stats.json".freeze
  INPUT_VALIDATION_NAME = "validate_input_summary.json".freeze
  INVALID_STEP_NAME = "invalid_step_input.json".freeze
  ERCC_OUTPUT_NAME = 'reads_per_gene.star.tab'.freeze
  BOWTIE2_ERCC_OUTPUT_NAME = "bowtie2_ERCC_counts.tsv".freeze
  KALLISTO_ERCC_OUTPUT_NAME = "ERCC_counts.tsv".freeze
  HOST_TRANSCRIPT_READS_OUTPUT_NAME = "reads_per_transcript.kallisto.tsv".freeze
  AMR_FULL_RESULTS_NAME = 'amr_processed_results.csv'.freeze
  REFINED_TAXON_COUNTS_JSON_NAME = 'refined_taxon_counts_with_dcr.json'.freeze
  REFINED_TAXID_BYTERANGE_JSON_NAME = 'refined_taxid_locations_combined.json'.freeze
  READS_PER_GENE_STAR_TAB_NAME = 'reads_per_gene.star.tab'.freeze
  FASTP_JSON_FILE = 'fastp.json'.freeze

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

  ASSEMBLY_PREFIX = 'refined_'.freeze
  ASSEMBLED_CONTIGS_NAME = 'contigs.fasta'.freeze
  ASSEMBLED_STATS_NAME = 'contig_stats.json'.freeze
  COVERAGE_VIZ_SUMMARY_JSON_NAME = 'coverage_viz_summary.json'.freeze
  CONTIG_SUMMARY_JSON_NAME = 'combined_contig_summary.json'.freeze
  CONTIG_NT_TOP_M8 = 'gsnap.blast.top.m8'.freeze
  CONTIG_NR_TOP_M8 = 'rapsearch2.blast.top.m8'.freeze
  CONTIG_MAPPING_NAME = 'contig2taxon_lineage.csv'.freeze
  CONTIG_BASE_COUNTS_NAME = 'contig_base_counts.json'.freeze

  LOCAL_JSON_PATH = '/tmp/results_json'.freeze
  # ONT specific constants
  ONT_NONHOST_READS_NAME = 'sample.humanfiltered.fastq'.freeze

  # files used to start AMR workflow
  GSNAP_FILTERED_NAMES = ["gsnap_filter_1.fa", "gsnap_filter_2.fa"].freeze
  SUBSAMPLED_NAMES = ["subsampled_1.fa", "subsampled_2.fa"].freeze
  HISAT2_HOST_FILTERED_NAMES = ["hisat2_host_filtered1.fastq", "hisat2_host_filtered2.fastq"].freeze
  HISAT2_HUMAN_FILTERED_NAMES = ["hisat2_human_filtered1.fastq", "hisat2_human_filtered2.fastq"].freeze
  DUPLICATE_CLUSTERS_NAME = "clusters.csv".freeze
  DUPLICATE_CLUSTER_SIZES_NAME = "duplicate_cluster_sizes.tsv".freeze

  PIPELINE_VERSION_WHEN_NULL = '1.0'.freeze
  # minimal number of reads mapped to the contig
  MIN_CONTIG_READS = {
    TECHNOLOGY_INPUT[:illumina] => 4,
    TECHNOLOGY_INPUT[:nanopore] => 1,
  }.freeze

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
  STATUS_READY = 'READY'.freeze
  # NOTE: The current stored job_status are...
  # +-------------------------------------------+
  # | job_status                                |
  # +-------------------------------------------+
  # | 1.Host Filtering-FAILED                   |
  # | 1.Host Filtering-FAILED|READY             |
  # | 2.Minimap2/Diamond alignment-FAILED       |
  # | 2.Minimap2/Diamond alignment-FAILED|READY |
  # | 2.Minimap2/Diamond alignment-RUNNING      |
  # | 3.Post Processing-FAILED                  |
  # | 3.Post Processing-FAILED|READY            |
  # | 4.De-Novo Assembly-FAILED|READY           |
  # | 4.Experimental-FAILED                     |
  # | 4.Experimental-FAILED|READY               |
  # | 4.Experimental-SUCCEEDED                  |
  # | 4.Experimental-SUCCEEDED|READY            |
  # | CHECKED                                   |
  # | FAILED                                    |
  # | LOADED                                    |
  # +-------------------------------------------+
  # NOTE: kickoff_pipeline does not set a job_status
  validates :job_status, presence: true, allow_nil: true
  #
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
                        "insert_size_metrics" => "db_load_insert_size_metrics",
                        "accession_coverage_stats" => "db_load_accession_coverage_stats", }.freeze
  # Functions for checking if an optional output should have been generated
  # Don't include optional outputs
  CHECKERS_BY_OUTPUT = { "insert_size_metrics" => "should_have_insert_size_metrics" }.freeze
  REPORT_READY_OUTPUT = "taxon_counts".freeze

  # Values for results_finalized are as follows.
  # Note we don't put a default on results_finalized in the schema, so that we can
  # recognize old runs by results_finalized being nil.
  # NOTE: kickoff_pipeline does not set results_finalized
  IN_PROGRESS = 0
  FINALIZED_SUCCESS = 10
  FINALIZED_FAIL = 20
  validates :results_finalized, presence: true, allow_nil: true, inclusion: { in: [
    IN_PROGRESS,
    FINALIZED_SUCCESS,
    FINALIZED_FAIL,
  ] }

  validates :finalized, presence: true, inclusion: { in: [0, 1] }
  validates :total_ercc_reads, numericality: { greater_than_or_equal_to: 0, integer_only: true }, allow_nil: true

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

  # Triggers a run for new samples by defining output states and run stages configurations.
  # *Exception* for cloned pipeline runs that already have results and finalized status
  after_create :create_output_states, :create_run_stages, unless: :results_finalized?
  before_destroy :cleanup_relations
  before_destroy :cleanup_s3

  delegate :status_url, to: :sample

  enum pipeline_execution_strategy: {
    directed_acyclic_graph: "directed_acyclic_graph",
    step_function: "step_function",
  }

  scope :non_deprecated, -> { where(deprecated: false) }
  scope :non_deleted, -> { where(deleted_at: nil) }

  def workflow
    if technology == TECHNOLOGY_INPUT[:illumina]
      WorkflowRun::WORKFLOW[:short_read_mngs]
    else
      WorkflowRun::WORKFLOW[:long_read_mngs]
    end
  end

  def parse_dag_vars
    JSON.parse(dag_vars || "{}")
  end

  def check_box_label
    project_name = sample.project ? sample.project.name : 'Unknown Project'
    "#{project_name} : #{sample.name} (#{id})"
  end

  def self.in_progress
    where("job_status != '#{STATUS_FAILED}' OR job_status IS NULL")
      .where(finalized: 0)
  end

  def self.results_in_progress
    where(results_finalized: IN_PROGRESS)
  end

  def self.top_completed_runs
    where("id in (select max(id) from pipeline_runs where job_status = 'CHECKED' and
                  sample_id in (select id from samples) group by sample_id)")
  end

  def finalized?
    finalized == 1
  end

  def self.deletable(user)
    # Note: the `or` statement is because ONT runs with failed uploads do not have `finalized = 1`,
    # so they otherwise can't be deleted (Illumina runs that failed to upload don't create a PipelineRun record).
    scope = joins(:sample).where(finalized: 1).or(where(samples: { upload_error: Sample::FINALIZED_UPLOAD_ERRORS }))
    scope = scope.where(samples: { user_id: user.id })
    scope
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
    # First, determine which outputs we need.
    # Default to the illumina outputs if technology is not present.
    target_outputs = technology.blank? ? TARGET_OUTPUTS[TECHNOLOGY_INPUT[:illumina]] : TARGET_OUTPUTS[technology]

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
    if technology == TECHNOLOGY_INPUT[:illumina]
      PipelineRunStage::STAGE_INFO.each do |step_number, info|
        run_stages << PipelineRunStage.new(
          step_number: step_number,
          name: info[:name],
          job_command_func: info[:job_command_func]
        )
      end
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
    # TODO(tiago): we should not have to access aws. see IDSEQ-2602.
    align_summary_file = "#{postprocess_output_s3_path}/align_viz.summary"
    return align_summary_file && S3Util.get_s3_file(align_summary_file) ? true : false
  end

  def succeeded?
    job_status == STATUS_CHECKED
  end

  def ercc_output_path
    if pipeline_version_uses_new_host_filtering_stage(pipeline_version)
      if pipeline_version_uses_bowtie2_to_calculate_ercc_reads(pipeline_version)
        return BOWTIE2_ERCC_OUTPUT_NAME
      else
        return KALLISTO_ERCC_OUTPUT_NAME
      end
    end
    ERCC_OUTPUT_NAME
  end

  def db_load_ercc_counts
    ercc_s3_path = "#{host_filter_output_s3_path}/#{ercc_output_path}"
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
    total_ercc_reads = ercc_counts_array.pluck(:count).sum
    total_ercc_reads *= sample.input_files.fastq.count unless pipeline_version_uses_bowtie2_to_calculate_ercc_reads(pipeline_version)

    update(total_ercc_reads: total_ercc_reads)
  end

  def host_filtering_stage
    pipeline_run_stages.find { |prs| prs["step_number"] == 1 }
  end

  def should_have_insert_size_metrics
    host_filtering_step_statuses = host_filtering_stage.step_statuses

    if pipeline_version_uses_new_host_filtering_stage(pipeline_version)
      # Only paired-end samples should have insert size metrics.
      # Check if the s3 object for INSERT_SIZE_METRICS_OUTPUT_NAME exists.
      prefix = output_s3_path_with_version.split("/", 4)[-1]
      return AwsClient[:s3].head_object(bucket: SAMPLES_BUCKET_NAME, key: "#{prefix}/#{PipelineRun::INSERT_SIZE_METRICS_OUTPUT_NAME}").present?
    else
      additional_outputs = get_additional_outputs(host_filtering_step_statuses, "star_out")
      return additional_outputs.include?(INSERT_SIZE_METRICS_OUTPUT_NAME)
    end
  rescue Aws::S3::Errors::NotFound
    return false
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
      LogUtil.log_error(
        error_message,
        pipeline_run_id: id
      )
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
    return "#{postprocess_output_s3_path}/#{COVERAGE_VIZ_SUMMARY_JSON_NAME}"
  end

  def coverage_viz_data_s3_path(accession_id)
    "#{coverage_viz_output_s3_path}/#{accession_id}_coverage_viz.json" if pipeline_version_has_coverage_viz(pipeline_version) || technology == TECHNOLOGY_INPUT[:nanopore]
  end

  def coverage_viz_output_s3_path
    if step_function?
      sfn_results_path
    else
      "#{postprocess_output_s3_path}/coverage_viz"
    end
  end

  def contigs_fasta_s3_path
    return "#{assembly_s3_path}/#{ASSEMBLED_CONTIGS_NAME}" if supports_assembly?
  end

  def annotated_fasta_s3_path
    return "#{assembly_s3_path}/#{ASSEMBLY_PREFIX}#{DAG_ANNOTATED_FASTA_BASENAME}" if supports_assembly?
    return "#{postprocess_output_s3_path}/#{DAG_ANNOTATED_FASTA_BASENAME}" if pipeline_version_at_least_2(pipeline_version)

    hit_fasta_basename = if pipeline_version_at_least(pipeline_version, "6.0.0")
                           HIT_FASTA_BASENAME
                         else
                           CDHITDUP_HIT_FASTA_BASENAME
                         end
    multihit? ? "#{alignment_output_s3_path}/#{MULTIHIT_FASTA_BASENAME}" : "#{alignment_output_s3_path}/#{hit_fasta_basename}"
  end

  def host_count_s3_path
    if pipeline_version_uses_new_host_filtering_stage(pipeline_version)
      "#{host_filter_output_s3_path}/#{HOST_TRANSCRIPT_READS_OUTPUT_NAME}"
    else
      "#{host_filter_output_s3_path}/#{READS_PER_GENE_STAR_TAB_NAME}"
    end
  end

  def nonhost_fastq_s3_paths(prefix = '')
    if technology == TECHNOLOGY_INPUT[:illumina]
      input_file_ext = sample.fasta_input? ? 'fasta' : 'fastq'
      files = [
        "#{postprocess_output_s3_path}/#{prefix}nonhost_R1.#{input_file_ext}",
      ]

      if sample.input_files.fastq.length == 2
        files << "#{postprocess_output_s3_path}/#{prefix}nonhost_R2.#{input_file_ext}"
      end
    else
      files = "#{postprocess_output_s3_path}/#{ONT_NONHOST_READS_NAME}"
    end
    files
  end

  # Unidentified is also referred to as "unmapped"
  def unidentified_fasta_s3_path
    return "#{assembly_s3_path}/#{ASSEMBLY_PREFIX}#{DAG_UNIDENTIFIED_FASTA_BASENAME}" if supports_assembly?
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
  def host_subtracted
    sample.host_genome.ercc_only? ? "ERCC Only" : sample.host_genome.name
  end

  def get_lineage_json(ct2taxid, taxon_lineage_map)
    # Get the full lineage based on taxid
    # Sample output:
    # {"NT": [573,570,543,91347,1236,1224,-650,2, "Bacteria"],
    #  "NR": [573,570,543,91347,1236,1224,-650,2, "Bacteria"]}
    output = {}
    if ct2taxid
      ct2taxid.each do |count_type, taxid|
        lineage = taxon_lineage_map[taxid.to_i]
        if lineage.nil? && taxid.to_i > 0
          LogUtil.log_error(
            "No lineage found for taxid #{taxid} when loading contigs.",
            exception: TaxonLineage::LineageNotFoundError.new(taxid),
            lineage_version: alignment_config.lineage_version
          )
        end
        output[count_type] = lineage
      end
    end
    output
  end

  def get_m8_mapping(m8_file)
    m8_s3_path = "#{assembly_s3_path}/#{m8_file}"
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

    # TODO(omar): Get mapping for merged_NT_NR?
    nt_m8_map = get_m8_mapping(CONTIG_NT_TOP_M8)
    nr_m8_map = get_m8_mapping(CONTIG_NR_TOP_M8)
    header_row = ['contig_name', 'read_count']
    header_row << 'base_count' if technology == "ONT"
    header_row += ['contig_length', 'contig_coverage']
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
      row << c.base_count if technology == "ONT"
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
    CSVSafe.open(local_file_name, 'w') do |writer|
      write_contig_mapping_table_csv(writer)
    end
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
    contig_s3_path = "#{assembly_s3_path}/#{ASSEMBLED_CONTIGS_NAME}"

    downloaded_contig_stats = PipelineRun.download_file_with_retries(contig_stats_s3_path,
                                                                     LOCAL_JSON_PATH, 3)
    contig_stats_json = JSON.parse(File.read(downloaded_contig_stats))
    return if contig_stats_json.empty?

    if technology == TECHNOLOGY_INPUT[:nanopore]
      contig_base_counts_path = s3_file_for("contig_bases")
      downloaded_contig_base_counts = PipelineRun.download_file_with_retries(contig_base_counts_path,
                                                                             LOCAL_JSON_PATH, 3)
      contig_base_counts_json = JSON.parse(File.read(downloaded_contig_base_counts))
    end

    contig_fasta = PipelineRun.download_file_with_retries(contig_s3_path, LOCAL_JSON_PATH, 3)
    contig_array = []
    taxid_list = []
    contig2taxid.values.each { |entry| taxid_list += entry.values }

    taxon_lineage_map = lineage_map_by_taxid(taxid_list)

    # A lambda allows us to access variables in the enclosing scope, such as contig2taxid.
    get_contig_hash = lambda do |header, sequence|
      read_count = contig_stats_json[header] || 0
      base_count = technology == TECHNOLOGY_INPUT[:nanopore] ? (contig_base_counts_json[header] || 0) : nil
      lineage_json = get_lineage_json(contig2taxid[header], taxon_lineage_map)

      species_taxid_nt = lineage_json.dig(TaxonCount::COUNT_TYPE_NT, 0) || nil
      species_taxid_nr = lineage_json.dig(TaxonCount::COUNT_TYPE_NR, 0) || nil
      genus_taxid_nt = lineage_json.dig(TaxonCount::COUNT_TYPE_NT, 1) || nil
      genus_taxid_nr = lineage_json.dig(TaxonCount::COUNT_TYPE_NR, 1) || nil

      # Set the merged_NT_NR values to nil because this feature is not in use.
      # We will revisit this in the future so we don't want to remove the existing
      # code/db model, but we do want to stop taking up space in the DB. When we do
      # revisit this feature, we'll likely update how we calculate this score, so
      # we'll need to recompute all these numbers anyway.
      {
        name: header, sequence: sequence, read_count: read_count, base_count: base_count, lineage_json: lineage_json.to_json,
        species_taxid_nt: species_taxid_nt, species_taxid_nr: species_taxid_nr, species_taxid_merged_nt_nr: nil,
        genus_taxid_nt: genus_taxid_nt, genus_taxid_nr: genus_taxid_nr, genus_taxid_merged_nt_nr: nil,
      }
    end

    File.open(contig_fasta, 'r') do |cf|
      line = cf.gets
      header = ''
      sequence = ''
      while line
        if line[0] == '>'
          contig_hash = get_contig_hash.call(header, sequence)
          if contig_hash[:read_count] >= MIN_CONTIG_READS[technology] && header != ''
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
      if contig_hash[:read_count] >= MIN_CONTIG_READS[technology]
        contig_array << contig_hash
      end
    end
    update(contigs_attributes: contig_array) unless contig_array.empty?
    update(assembled: 1)
  end

  def db_load_accession_coverage_stats
    coverage_viz_summary = S3Util.get_s3_file(coverage_viz_summary_s3_path)
    return if coverage_viz_summary.blank?

    coverage_viz_summary = JSON.parse(coverage_viz_summary)

    accession_coverage_stats_array = []
    coverage_viz_summary.each do |taxid, stats|
      best_accessions = stats["best_accessions"]
      top_accession = best_accessions&.first
      if top_accession
        accession_coverage_stats_array << format_accession_coverage_stats(top_accession, taxid)
      end
    end
    update(accession_coverage_stats_attributes: accession_coverage_stats_array) unless accession_coverage_stats_array.empty?
  end

  def format_accession_coverage_stats(accession, taxid)
    accession_stats = {
      accession_id: accession["id"],
      accession_name: accession["name"],
      taxid: taxid,
      num_contigs: accession["num_contigs"],
      num_reads: accession["num_reads"],
      score: accession["score"],
      coverage_depth: accession["coverage_depth"],
    }
    if accession["coverage_breadth"]
      accession_stats[:coverage_breadth] = accession["coverage_breadth"]
    else
      # coverage_breadth is not included in the coverage_viz_summary file for pipeline runs before v6.8.3,
      # so we must fetch the value from the specific accession's file.
      accession_coverage_viz = S3Util.get_s3_file(coverage_viz_data_s3_path(accession["id"]))

      if accession_coverage_viz.blank?
        Rails.logger.error("No coverage viz file found for PipelineRun ##{id}, Accession #{accession['id']}.")
        return
      end

      accession_coverage_viz = JSON.parse(accession_coverage_viz)
      unless accession_coverage_viz.empty?
        accession_stats[:coverage_breadth] = accession_coverage_viz["coverage_breadth"]
      end
    end
    accession_stats
  end

  def invalid_family_call?(tcnt)
    # TODO:  Better family support.
    tcnt['family_taxid'].to_i < TaxonLineage::INVALID_CALL_BASE_ID
  rescue StandardError
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
      # Delete attributes that aren't in the DB schema.  These are emitted in versions >= v3.21
      tcnt.delete "dcr"
      tcnt.delete "unique_count"
      tcnt.delete "nonunique_count"
      # TODO:  Better family support.
      # Don't import merged_NT_NR for now since we don't use that feature yet.
      # We will revisit this in the future so we don't want to remove the existing
      # code/db model, but we do want to stop taking up space in the DB. When we do
      # revisit this feature, we'll likely update how we calculate this score, so
      # we'll need to recompute all these numbers anyway.
      tcnt["count_type"] != TaxonCount::COUNT_TYPE_MERGED && acceptable_tax_levels.include?(tcnt['tax_level'].to_i) && !invalid_family_call?(tcnt)
    end
    # Set created_at and updated_at
    current_time = Time.now.utc # to match TaxonLineage date range comparison
    tcnt_attrs_to_merge = {
      'created_at' => current_time,
      'updated_at' => current_time,
      'pipeline_run_id' => id,
    }
    taxon_counts_attributes_filtered.each do |tcnt|
      # Temporarily write to the new decimal type columns while we convert the columns from float to decimal type
      tcnt["percent_identity_decimal"] = tcnt["percent_identity"]
      tcnt["alignment_length_decimal"] = tcnt["alignment_length"]

      tcnt["count_type"] += "+" if refined
      rpm_value = rpm(tcnt["count"])
      tcnt["rpm"] = rpm_value
      tcnt["rpm_decimal"] = rpm_value

      if technology == TECHNOLOGY_INPUT[:nanopore]
        tcnt["bpm"] = bpm(tcnt["base_count"])
      end

      tcnt.merge!(tcnt_attrs_to_merge)
      # Format source count type as NT, NR or NT-NR (is currently an unordered array with possible unique value of ["NT", "NR"])
      tcnt["source_count_type"] = tcnt["source_count_type"] ? tcnt["source_count_type"].sort.reverse.join("-") : nil
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
    LogUtil.log_error("PipelineRun #{id} failed taxon_counts download", pipeline_run_id: id) unless downloaded_json_path
    return unless downloaded_json_path

    load_taxons(downloaded_json_path, false)
  end

  def db_load_byteranges
    byteranges_json_s3_path = s3_file_for("taxon_byteranges")
    downloaded_byteranges_path = PipelineRun.download_file(byteranges_json_s3_path, local_json_path)
    taxon_byteranges_csv_file = "#{local_json_path}/taxon_byteranges"
    hash_array_json2csv(downloaded_byteranges_path, taxon_byteranges_csv_file, %w[taxid hit_type first_byte last_byte])

    Syscall.run_in_dir(local_json_path, "sed", "-e", "s/$/,#{id}/", "-i", "taxon_byteranges")
    success = Syscall.run_in_dir(local_json_path, "mysqlimport --user=root --host=#{rds_host} --fields-terminated-by=',' --replace --local --columns=taxid,hit_type,first_byte,last_byte,pipeline_run_id idseq_#{Rails.env} taxon_byteranges")
    LogUtil.log_error("PipelineRun #{id} failed db_load_byteranges import", pipeline_run_id: id) unless success
    Syscall.run("rm", "-f", downloaded_byteranges_path)
  end

  def sfn_error
    return unless sfn_output_path

    error_type = SfnExecution.new(execution_arn: sfn_execution_arn, s3_path: sfn_output_path).error
    return error_type
  end

  def sfn_pipeline_error
    return unless sfn_output_path

    error_type, error_cause = SfnExecution.new(execution_arn: sfn_execution_arn, s3_path: sfn_output_path).pipeline_error
    return [error_type, error_cause]
  end

  def cleanup_s3
    return if sfn_output_path.blank?

    S3Util.delete_s3_prefix(sfn_output_path)
  end

  def workflow_version_tag
    # the tag used for docker container and idseq workflows definition
    return "#{workflow}-v#{wdl_version}"
  end

  def version_key_subpath
    # the s3 subpath based on wdl version used to store results
    return "#{workflow}-#{wdl_version.split('.')[0]}"
  end

  def wdl_s3_folder
    if pipeline_version_at_least(pipeline_version, "5.0.0") || technology == PipelineRun::TECHNOLOGY_INPUT[:nanopore]
      "s3://#{S3_WORKFLOWS_BUCKET}/#{workflow}-v#{wdl_version}"
    else
      "s3://#{S3_WORKFLOWS_BUCKET}/v#{wdl_version}/#{WorkflowRun::WORKFLOW[:main]}"
    end
  end

  def sfn_output_path
    return "" if sfn_execution_arn.blank?

    return s3_output_prefix || sample_output_s3_path
  end

  def sfn_results_path
    return "" if sfn_output_path.blank?

    if s3_output_prefix || pipeline_version_at_least(pipeline_version, "5.0.0")
      return File.join(sfn_output_path, version_key_subpath)
    else
      return "" unless pipeline_version.present? && wdl_version.present?

      sfn_name = sfn_execution_arn.split(':')[-2]
      return File.join(
        sfn_output_path,
        sfn_name,
        "wdl-#{wdl_version}",
        "dag-#{pipeline_version}"
      )
    end
  end

  def s3_file_for_sfn_result(filename)
    "#{sfn_results_path}/#{filename}"
  end

  def s3_file_for(output)
    # This function assumes that pipeline_version has been set and is assembly-enabled (>=3.1) for
    # taxon_counts/taxon_byteranges/contigs/contig_counts.
    unless pipeline_version.present? || finalized
      # No need to warn if finalized (likely failed)
      LogUtil.log_error("s3_file_for was called without a pipeline_version for PR #{id}", pipeline_run_id: id)
    end

    full_path = case output
                when "ercc_counts"
                  "#{host_filter_output_s3_path}/#{ercc_output_path}"
                when "amr_counts" # deprecated
                  "#{postprocess_output_s3_path}/#{AMR_FULL_RESULTS_NAME}"
                when "taxon_counts"
                  "#{assembly_s3_path}/#{REFINED_TAXON_COUNTS_JSON_NAME}"
                when "taxon_byteranges"
                  "#{assembly_s3_path}/#{REFINED_TAXID_BYTERANGE_JSON_NAME}"
                when "contigs"
                  "#{assembly_s3_path}/#{ASSEMBLED_STATS_NAME}"
                when "contig_counts"
                  "#{assembly_s3_path}/#{CONTIG_SUMMARY_JSON_NAME}"
                when "insert_size_metrics"
                  "#{host_filter_output_s3_path}/#{INSERT_SIZE_METRICS_OUTPUT_NAME}"
                when "accession_coverage_stats"
                  coverage_viz_summary_s3_path
                when "contig_bases"
                  "#{assembly_s3_path}/#{CONTIG_BASE_COUNTS_NAME}"

                end
    # Extra check in case prefix was nil/invalid:
    full_path.start_with?("/") ? nil : full_path
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

    status_display_helper(output_state_hash(output_states_by_pipeline_run_id), results_finalized, technology)
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

    Rails.logger.info("[PR: #{id}] Checking output - finalized: #{finalized?}, last update: #{updated_at}")
    # If the run completed over a minute ago, the output should be available.
    should_be_available = finalized? && updated_at < 1.minute.ago
    if output_ready?(output)
      Rails.logger.info("[PR: #{id}] Enqueue for resque: #{output}")
      output_state.update(state: STATUS_LOADING_QUEUED)
      Resque.enqueue(ResultMonitorLoader, id, output)
    # If we're using async notifications, the output should be available.
    elsif should_be_available || AppConfigHelper.get_app_config(AppConfig::ENABLE_SFN_NOTIFICATIONS) == "1"
      Rails.logger.info("[PR: #{id}] Should have been generated: #{output_state.output}")
      checker = CHECKERS_BY_OUTPUT[output_state.output]
      # If there is no checker, the file should have been generated
      # If there is a checker use it to check if the file should have been generated
      should_have_been_generated = !checker || send(checker)
      if should_have_been_generated
        output_state.update(state: STATUS_FAILED)
        LogUtil.log_error("Failed to load #{output_state.output} for PipelineRun #{id}; output file was not available. results_finalized will be marked as failed.")
      else
        output_state.update(state: STATUS_LOADED)
      end
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

    # Get pipeline_version, which determines S3 locations of output files.
    # If pipeline version is not present, we cannot load results yet.
    # Except, if the pipeline run is finalized, we have to (this is a failure case).
    update_pipeline_version(self, :pipeline_version, pipeline_version_file) if pipeline_version.blank?
    return if pipeline_version.blank? && !finalized

    # Update job stats:
    compiling_stats_error = update_job_stats

    # Load any new outputs that have become available:
    output_states.each do |o|
      check_and_enqueue(o)
    end

    # Check if run is complete:
    if all_output_states_terminal?
      finalize_results(compiling_stats_error)
    end
  end

  def load_stage_results(last_completed_stage)
    return if results_finalized?

    # Get pipeline_version, which determines S3 locations of output files.
    # If pipeline version is not present, we cannot load results yet.
    # Except, if the pipeline run is finalized, we have to (this is a failure case).
    update_pipeline_version(self, :pipeline_version, pipeline_version_file) if pipeline_version.blank?
    return if pipeline_version.blank? && !finalized

    # Load any new outputs that have become available based on the last completed stage:
    stage_outputs = PipelineRunStage::OUTPUTS_BY_STAGE[last_completed_stage]
    output_states.where(output: stage_outputs).each do |o|
      check_and_enqueue(o)
    end

    # Job stats are compiled from *.count files, which are outputs of Host Filtering and Postprocessing
    if last_completed_stage == PipelineRunStage::DAG_NAME_HOST_FILTER || last_completed_stage == PipelineRunStage::DAG_NAME_POSTPROCESS
      compiling_stats_error = update_job_stats
      if compiling_stats_error.present?
        LogUtil.log_error("SampleFailedEvent: Failure compiling stats for PipelineRun #{id}: #{compiling_stats_error}")
      end
    end

    # Check if run is complete:
    if all_output_states_terminal?
      compiling_stats_error = check_job_stats
      finalize_results(compiling_stats_error)
    end
  end

  def update_job_stats
    MngsReadsStatsLoadService.call(self)

    job_stats_hash = job_stats.index_by(&:task)
    load_qc_percent(job_stats_hash)
    load_compression_ratio(job_stats_hash)

    # return nil to indicate no error has occurred
    return nil
  rescue StandardError => error
    LogUtil.log_error("Failure compiling stats: #{error}", exception: error)
    error
  end

  def finalize_results(compiling_stats_error)
    if all_output_states_loaded? && compiling_stats_error.blank?
      update(
        results_finalized: FINALIZED_SUCCESS,
        time_to_results_finalized: time_since_executed_at
      )

      # Precache reports for all backgrounds.
      if ready_for_cache?
        Resque.enqueue(PrecacheReportInfo, id)
      end
      event = EventDictionary::PIPELINE_RUN_SUCCEEDED
    else
      update(
        results_finalized: FINALIZED_FAIL,
        time_to_results_finalized: time_since_executed_at
      )
      event = EventDictionary::PIPELINE_RUN_FAILED
    end

    MetricUtil.log_analytics_event(
      event,
      sample.user,
      pipeline_run_id: id, project_id: sample.project.id, run_time: run_time
    )
  end

  def check_job_stats
    stats_json_s3_path = "#{output_s3_path_with_version}/#{STATS_JSON_NAME}"
    stats_file = S3Util.get_s3_file(stats_json_s3_path)
    return unless stats_file

    # Get the list of all the tasks in the job stats file and check that they have all
    # been loaded into the db.
    stats_array = JSON.parse(stats_file)
    stats_array = stats_array.select { |entry| entry.key?("task") }.map { |job| job["task"] }
    loaded_job_stats = job_stats.pluck(:task)
    all_stats_loaded = stats_array.sort == loaded_job_stats.sort

    # If we are missing job stats in the db, log and return an error.
    unless all_stats_loaded
      error = "PipelineRun #{id} failed to load job stats: #{stats_array - loaded_job_stats}"
      LogUtil.log_error(error)
      error
    end
  end

  def dispatch
    sfn_service_result = {}
    begin
      if technology == TECHNOLOGY_INPUT[:illumina]
        sfn_service_result = SfnPipelineDispatchService.call(self)
      elsif technology == TECHNOLOGY_INPUT[:nanopore]
        sfn_service_result = SfnLongReadMngsPipelineDispatchService.call(self)
      end
      update(
        sfn_execution_arn: sfn_service_result[:sfn_execution_arn],
        pipeline_version: sfn_service_result[:pipeline_version]
      )
      Rails.logger.info("PipelineRun: id=#{id} sfn_execution_arn=#{sfn_service_result[:sfn_execution_arn]}")
    rescue StandardError => e
      LogUtil.log_error("Error starting SFN pipeline: #{e}", exception: e)
      # we will not retry in this case, since we do not know what error occurred
    end

    if sfn_service_result[:sfn_execution_arn].blank?
      update(
        job_status: STATUS_FAILED,
        finalized: 1,
        time_to_finalized: time_since_executed_at
      )
    end
  end

  def update_job_status
    automatic_restart = false
    prs = active_stage
    if prs.nil?
      # all stages succeeded
      self.finalized = 1
      self.time_to_finalized = time_since_executed_at
      self.job_status = STATUS_CHECKED
    else
      if prs.failed?
        self.job_status = STATUS_FAILED
        self.finalized = 1
        self.time_to_finalized = time_since_executed_at
        self.known_user_error, self.error_message = check_for_user_error(prs)
        automatic_restart = automatic_restart_allowed? unless known_user_error
        report_failed_pipeline_run_stage(prs, known_user_error, automatic_restart)
      elsif !prs.started?
        # Note: this is not ideally place to initialize an SFN pipeline but
        # in order to preserve most of the logic of the old pipeline we decided
        # that this was the least intrusive place (vs. both downstream in run_job>host_filtering_command
        # and upstream)
        if step_function? && prs.step_number == 1
          dispatch
        end

        # Run job will trigger dag pipeline for a particular stage
        # we're moving on to a new stage
        prs.run_job
      else
        # still running
        prs.update_job_status
        # Check for long-running pipeline run and log/alert if needed
        check_and_log_long_run
      end
      self.job_status = format_job_status_text(prs.step_number, prs.name, prs.job_status, report_ready?)
    end
    save!
    enqueue_new_pipeline_run if automatic_restart
  end

  # The long-reads-mngs pipeline doesn't have multiple stages,
  # so we update the run's status directly from the SFN execution.
  # This method follows the same logic/pattern of WorkflowRun#update_status.
  def update_single_stage_run_status
    remote_status = sfn_execution.description[:status]

    if WorkflowRun::FAILED_REMOTE_STATUSES.include?(remote_status)
      remote_status = STATUS_FAILED

      error_message = nil
      if input_error.present?
        known_user_error, error_message = input_error.values_at(:label, :message)
      else
        Rails.logger.error("SampleFailedEvent: Sample #{sample.id} by " \
        "#{sample.user.role_name} failed PipelineRun #{id} (#{workflow}). See: #{sample.status_url}")
      end
      update(
        finalized: 1,
        time_to_finalized: time_since_executed_at,
        known_user_error: known_user_error,
        error_message: error_message,
        job_status: remote_status
      )
    elsif remote_status == WorkflowRun::STATUS[:succeeded]
      update(
        finalized: 1,
        time_to_finalized: time_since_executed_at,
        job_status: STATUS_CHECKED
      )
    # prevent run status from reverting to RUNNING if messages are processed out of order
    elsif !finalized? && remote_status != job_status
      update(job_status: remote_status)
    end
  end

  # This method should be renamed to update_job_status after fully transitioning to step functions
  # and completely removing the polling mechanism and DAG pipeline_execution_strategy
  def async_update_job_status
    # active_stage is the first PipelineRunStage that is not succeeded.
    prs = active_stage
    if prs.present?
      prs.update_job_status
    end

    # If the last active_stage was successful, we proceed to the next stage (if there is one),
    # and update its status and created_at/executed_at times accordingly.
    if prs.present? && prs.succeeded?
      prs = active_stage
      if prs.present?
        prs.run_job
        prs.update_job_status
      end
    end

    if prs.nil?
      # All stages succeeded.
      self.finalized = 1
      self.time_to_finalized = time_since_executed_at
      self.job_status = STATUS_CHECKED
    else
      if prs.failed?
        # The pipeline encountered a failure.
        self.job_status = STATUS_FAILED
        self.finalized = 1
        self.time_to_finalized = time_since_executed_at
        self.known_user_error, self.error_message = check_for_user_error(prs)
        report_failed_pipeline_run_stage(prs, known_user_error)
      else
        # The pipeline is still running.
        # Check for long-running pipeline run and log/alert if needed.
        check_and_log_long_run
      end
      self.job_status = format_job_status_text(prs.step_number, prs.name, prs.job_status || PipelineRunStage::STATUS_STARTED, report_ready?)
    end
    save!
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
    return "Pipeline Initializing" unless job_status

    stage = job_status.to_s.split("-")[0].split(".")[1]
    stage ? "Running #{stage}" : job_status
  end

  def run_time
    Time.now.utc - created_at
  end

  def duration_hrs
    (run_time / 60 / 60).round(2)
  end

  def check_and_log_long_run
    # Check for long-running pipeline runs and log/alert if needed:
    if alert_sent.zero?
      # NOTE (2020-12-16): Based on the last 3000 pipeline runs, only 1 took longer than 18 hours.
      threshold = 18.hours
      if run_time > threshold
        msg = "LongRunningSampleEvent: Sample #{sample.id} by #{sample.user.role_name} has been running #{duration_hrs} hours. #{job_status_display} " \
          "See: #{status_url}"
        Rails.logger.error(msg)
        update(alert_sent: 1)
      end
    end
  end

  def local_json_path
    "#{LOCAL_JSON_PATH}/#{id}"
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
    s3_path = s3_path.to_s
    return false if s3_path.blank? || s3_path.start_with?("/")

    _stdout, _stderr, status = Open3.capture3("aws", "s3", "ls", s3_path)
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
      TaxonCount.connection.execute(ActiveRecord::Base.sanitize_sql_array(["
        UPDATE taxon_counts, taxon_lineages
        SET taxon_counts.name = taxon_lineages.#{level}_name,
            taxon_counts.common_name = taxon_lineages.#{level}_common_name
        WHERE taxon_counts.pipeline_run_id=:id AND
              taxon_counts.tax_level=:level_id AND
              taxon_counts.tax_id = taxon_lineages.taxid AND
              (:lineage_version BETWEEN taxon_lineages.version_start AND taxon_lineages.version_end) AND
              taxon_lineages.#{level}_name IS NOT NULL
      ", id: id, level_id: level_id, lineage_version: lineage_version,]))
    end
  end

  def update_genera
    lineage_version = alignment_config.lineage_version
    TaxonCount.connection.execute(ActiveRecord::Base.sanitize_sql_array(["
      UPDATE taxon_counts, taxon_lineages
      SET taxon_counts.genus_taxid = taxon_lineages.genus_taxid,
          taxon_counts.family_taxid = taxon_lineages.family_taxid,
          taxon_counts.superkingdom_taxid = taxon_lineages.superkingdom_taxid
      WHERE taxon_counts.pipeline_run_id=:id AND
            (:lineage_version BETWEEN taxon_lineages.version_start AND taxon_lineages.version_end) AND
            taxon_lineages.taxid = taxon_counts.tax_id
    ", id: id, lineage_version: lineage_version,]))
  end

  def update_superkingdoms
    lineage_version = alignment_config.lineage_version
    TaxonCount.connection.execute(ActiveRecord::Base.sanitize_sql_array(["
      UPDATE taxon_counts, taxon_lineages
      SET taxon_counts.superkingdom_taxid = taxon_lineages.superkingdom_taxid
      WHERE taxon_counts.pipeline_run_id=:id
            AND (:lineage_version BETWEEN taxon_lineages.version_start AND taxon_lineages.version_end)
            AND taxon_counts.tax_id > :invalid_call_base_id
            AND taxon_lineages.taxid = taxon_counts.tax_id
    ", id: id, lineage_version: lineage_version, invalid_call_base_id: TaxonLineage::INVALID_CALL_BASE_ID,]))
    TaxonCount.connection.execute(ActiveRecord::Base.sanitize_sql_array(["
      UPDATE taxon_counts, taxon_lineages
      SET taxon_counts.superkingdom_taxid = taxon_lineages.superkingdom_taxid
      WHERE taxon_counts.pipeline_run_id=:id
            AND (:lineage_version BETWEEN taxon_lineages.version_start AND taxon_lineages.version_end)
            AND taxon_counts.tax_id < :invalid_call_base_id
            AND taxon_lineages.taxid = MOD(ABS(taxon_counts.tax_id), ABS(:invalid_call_base_id))
    ", id: id, lineage_version: lineage_version, invalid_call_base_id: TaxonLineage::INVALID_CALL_BASE_ID,]))
  end

  def update_is_phage
    TaxonCount.connection.execute(ActiveRecord::Base.sanitize_sql_array(["
      UPDATE taxon_counts, taxon_lineages
      SET taxon_counts.is_phage = taxon_lineages.is_phage
      WHERE pipeline_run_id=:id AND
            taxon_counts.tax_id = taxon_lineages.taxid
    ", id: id,]))
  end

  def bases_before_and_after_subsampling
    # the host filtering step occurs before the subsampling step
    JobStat.where(pipeline_run: self, task: ["human_filtered_bases", "subsampled_bases"]).pluck(:bases_after)
  end

  def subsampled_reads
    # number of non-host reads that actually went through non-host alignment
    res = adjusted_remaining_reads
    if subsample
      # Ex: max of 1,000,000 or 2,000,000 reads
      max_reads = subsample * sample.input_files.fastq.count
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
    if fraction_subsampled # rubocop:disable Style/RedundantCondition
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
    if step_function?
      sfn_results_path
    else
      # TODO: deprecate this function. no need for a separate dir for exp results.
      pipeline_ver_str = ""
      pipeline_ver_str = "#{pipeline_version}/" if pipeline_version
      result = "#{sample.sample_expt_s3_path}/#{pipeline_ver_str}#{subsample_suffix}"
      result.chomp("/")
    end
  end

  def postprocess_output_s3_path
    if step_function?
      sfn_results_path
    else
      pipeline_ver_str = ""
      pipeline_ver_str = "#{pipeline_version}/" if pipeline_version
      result = "#{sample.sample_postprocess_s3_path}/#{pipeline_ver_str}#{subsample_suffix}"
      result.chomp("/")
    end
  end

  def assembly_s3_path
    step_function? ? sfn_results_path : "#{postprocess_output_s3_path}/assembly"
  end

  def alignment_viz_json_s3(taxon_info)
    # taxon_info example: 'nt.species.573'
    "#{alignment_viz_output_s3_path}/#{taxon_info}.align_viz.json"
  end

  def alignment_viz_output_s3_path
    if step_function?
      sfn_results_path
    else
      "#{postprocess_output_s3_path}/align_viz"
    end
  end

  def five_longest_reads_fasta_s3(taxon_info)
    # taxon_info example: 'nt.species.573'
    "#{alignment_viz_output_s3_path}/#{taxon_info}.longest_5_reads.fasta"
  end

  def host_filter_output_s3_path
    step_function? ? sfn_results_path : output_s3_path_with_version
  end

  def output_s3_path_with_version
    if step_function?
      sfn_results_path
    elsif pipeline_version
      "#{sample.sample_output_s3_path}/#{pipeline_version}"
    else
      sample.sample_output_s3_path
    end
  end

  def s3_paths_for_taxon_byteranges
    path = supports_assembly? ? assembly_s3_path : postprocess_output_s3_path
    file_prefix = supports_assembly? ? ASSEMBLY_PREFIX : ""
    # by tax_level and hit_type
    {
      TaxonCount::TAX_LEVEL_SPECIES => {
        'NT' => "#{path}/#{file_prefix}#{SORTED_TAXID_ANNOTATED_FASTA}",
        'NR' => "#{path}/#{file_prefix}#{SORTED_TAXID_ANNOTATED_FASTA_NR}",
      },
      TaxonCount::TAX_LEVEL_GENUS => {
        'NT' => "#{path}/#{file_prefix}#{SORTED_TAXID_ANNOTATED_FASTA_GENUS_NT}",
        'NR' => "#{path}/#{file_prefix}#{SORTED_TAXID_ANNOTATED_FASTA_GENUS_NR}",
      },
      TaxonCount::TAX_LEVEL_FAMILY => {
        'NT' => "#{path}/#{file_prefix}#{SORTED_TAXID_ANNOTATED_FASTA_FAMILY_NT}",
        'NR' => "#{path}/#{file_prefix}#{SORTED_TAXID_ANNOTATED_FASTA_FAMILY_NR}",
      },
    }
  end

  def pipeline_version_file
    # Legacy pipeline only
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
    technology == TECHNOLOGY_INPUT[:nanopore] || after(pipeline_version || fetch_pipeline_version, "1.5")
  end

  def assembly?
    after(pipeline_version, "1000.1000")
    # Very big version number so we don't accidentally start going into assembly mode.
    # Once we decide to deploy the assembly pipeline, change "1000.1000" to the relevant version number of idseq-pipeline.
  end

  def contig_lineages
    contigs.select("id, read_count, lineage_json")
           .where("lineage_json IS NOT NULL")
  end

  def get_contigs_for_taxid(taxid, db = "nt_and_nr")
    contig_ids = []
    contig_lineages().each do |c|
      lineage = JSON.parse(c.lineage_json)

      if db.casecmp("NT").zero?
        contig_ids << c.id if lineage&.[]("NT")&.include?(taxid)
      elsif db.casecmp("NR").zero?
        contig_ids << c.id if lineage&.[]("NR")&.include?(taxid)
      # look through NT, NR, and merged_NT_NR
      elsif lineage.values.flatten.include?(taxid)
        contig_ids << c.id
      end
    end

    contigs.where(id: contig_ids).order("read_count DESC")
  end

  def summary_contig_counts
    # Stores the number of contigs that match a given taxid, count_type (nt, nr, or merged_nt_nr), and read_count (number of reads aligned to that contig).
    # Create and store default values for the hash if the key doesn't exist yet
    summary_dict = Hash.new do |summary, taxid|
      summary[taxid] = Hash.new do |taxid_hash, count_type| # rubocop forces different variable names
        taxid_hash[count_type] = Hash.new do |count_type_hash, read_count|
          count_type_hash[read_count] = 0
        end
      end
    end

    count_key = technology == PipelineRun::TECHNOLOGY_INPUT[:illumina] ? :read_count : :base_count

    contig_taxids = contigs.where.not(lineage_json: [nil, ""])
                           .pluck(count_key, :species_taxid_nt, :species_taxid_nr, :species_taxid_merged_nt_nr, :genus_taxid_nt, :genus_taxid_nr, :genus_taxid_merged_nt_nr)

    contig_taxids.each do |c|
      count_key, species_taxid_nt, species_taxid_nr, species_taxid_merged_nt_nr, genus_taxid_nt, genus_taxid_nr, genus_taxid_merged_nt_nr = c

      summary_dict[species_taxid_nt]["nt"][count_key] += 1 if species_taxid_nt
      summary_dict[species_taxid_nr]["nr"][count_key] += 1 if species_taxid_nr
      summary_dict[species_taxid_merged_nt_nr]["merged_nt_nr"][count_key] += 1 if species_taxid_merged_nt_nr

      summary_dict[genus_taxid_nt]["nt"][count_key] += 1 if genus_taxid_nt
      summary_dict[genus_taxid_nr]["nr"][count_key] += 1 if genus_taxid_nr
      summary_dict[genus_taxid_merged_nt_nr]["merged_nt_nr"][count_key] += 1 if genus_taxid_merged_nt_nr
    end
    return summary_dict
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

    ercc_counts_by_name = ercc_counts.index_by(&:name)

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
    if step_function?
      return sfn_outputs_by_step(can_see_stage1_results)
    elsif directed_acyclic_graph?
      return dag_outputs_by_step(can_see_stage1_results)
    end

    return {}
  end

  def sfn_outputs_by_step(can_see_stage1_results = false)
    case technology
    when TECHNOLOGY_INPUT[:illumina]
      return illumina_sfn_outputs_by_step(can_see_stage1_results)
    when TECHNOLOGY_INPUT[:nanopore]
      return ont_sfn_outputs_by_step
    end
  end

  STEP_TO_JOB_STAT = {
    "RunValidateInput" => "validated_bases",
    "RunQualityFilter" => "quality_filtered_bases",
    "RunHostFilter" => "host_filtered_bases",
    "RunHumanFilter" => "human_filtered_bases",
    "RunSubsampling" => "subsampled_bases",
  }.freeze

  def ont_sfn_outputs_by_step
    result_files = {}

    data = SfnSingleStagePipelineDataService.new(id, PipelineRun::TECHNOLOGY_INPUT[:nanopore]).call
    singular_stage_index = 0
    steps_with_output_files = data[:stages][singular_stage_index][:steps]
    job_stats_by_task = job_stats.index_by(&:task)

    # could make this it's own helper func somewhere
    camel_case = ->(string) { string.titleize.delete(" ").sub(string.chr, string.chr.downcase) }

    steps = {}
    # Collect step information
    steps_with_output_files.each do |step|
      step_dict = {
        name: StringUtil.humanize_step_name(step[:name]),
        stepDescription: step[:description],
        fileList: step[:outputFiles],
        readsAfter: (job_stats_by_task[STEP_TO_JOB_STAT[step[:name]]] || {})["bases_after"],
      }
      # Convert to camelCase
      step_key = camel_case.call(step[:name])
      steps[step_key] = step_dict
    end

    # The ONT pipeline doesn't have any PipelineRunStages. I added this for compatibility with the frontend
    stage_name = "ONT Pipeline"
    stage_key = camel_case.call(stage_name)
    result_files[stage_key] = {
      name: stage_name,
      stageDescription: "this is the ONT pipeline 'stage' description",
      steps: steps,
    }

    result_files
  end

  def illumina_sfn_outputs_by_step(can_see_stage1_results = false)
    result_files = {}

    remove_stage1_urls = !can_see_stage1_results

    sfn_data_service = SfnPipelineDataService.new(id, true, remove_stage1_urls)
    stage_names = sfn_data_service.stage_names
    sfn_data = sfn_data_service.call

    # Get read counts
    job_stats_by_task = job_stats.index_by(&:task)

    # Because string.titleize.camelize breaks on "GSNAPL/RAPSEARCH2 alignment"
    camel_case = ->(string) { string.titleize.delete(" ").sub(string.chr, string.chr.downcase) }

    sfn_data[:stages].each_with_index do |stage, stage_index|
      stage_name = stage_names[stage_index]
      stage_description = STEP_DESCRIPTIONS[stage_name]["stage"]
      steps = {}

      # Collect step information
      stage[:steps].each do |step|
        # Trying not to rely on pipeline_run_stages for stage names, to make future development easier
        dag_name = SfnPipelineDataService::SFN_STEP_TO_DAG_STEP_NAME[stage_name][step[:name]]
        step_dict = {
          name: StringUtil.humanize_step_name(step[:name], stage_name),
          stepDescription: STEP_DESCRIPTIONS[stage_name]["steps"][dag_name],
          fileList: step[:outputFiles],
          readsAfter: (job_stats_by_task[dag_name] || {})["reads_after"],
        }
        # Convert to camelCase
        step_key = camel_case.call(step[:name])
        steps[step_key] = step_dict
      end

      stage_key = camel_case.call(stage_name)
      result_files[stage_key] = {
        name: stage_name,
        stageDescription: stage_description,
        steps: steps,
      }
    end

    return result_files
  end

  def dag_outputs_by_step(can_see_stage1_results = false)
    path_to_file = lambda { |file, dag|
      # TODO: should be refactored as part of https://jira.czi.team/browse/IDSEQ-2295
      if step_function?
        # keep everything after bucket name, except trailing '/'
        s3_key = sfn_results_path.chomp("/").split("/", 4)[3]
        return File.join(s3_key, file.split("/")[-1])
      else
        # keep everything after bucket name, except trailing '/'
        s3_key = dag["output_dir_s3"].chomp("/").split("/", 4)[3]
        return File.join(s3_key, pipeline_version, file)
      end
    }

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
        "stageDescription" => STEP_DESCRIPTIONS[prs.name]["stage"],
        "stageDagJson" => prs.redacted_dag_json,
        "name" => StringUtil.humanize_step_name(prs.name),
        "steps" => {},
      }
      dag_dict = JSON.parse(prs.dag_json)
      targets = dag_dict["targets"]
      given_targets = dag_dict["given_targets"]
      num_steps = targets.length
      # Fetch step statuses for this stage
      #   do it before the loop because step_statuses is expensive
      step_statuses = prs.step_statuses

      targets.each_with_index do |(target_name, output_list), step_idx|
        next if given_targets.key?(target_name)

        file_paths = []
        output_list.each do |output|
          file_paths << path_to_file.call(output, dag_dict)
        end

        get_additional_outputs(step_statuses, target_name).each do |filename|
          file_paths << path_to_file.call(filename, dag_dict)
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

        if file_info.present?
          result[prs.name]["steps"][target_name] = {
            "stepDescription" => STEP_DESCRIPTIONS[prs.name]["steps"][target_name],
            "name" => StringUtil.humanize_step_name(target_name),
            "fileList" => file_info,
            "readsAfter" => (job_stats_by_task[target_name] || {})["reads_after"],
          }
        end
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
    if technology == TECHNOLOGY_INPUT[:nanopore]
      # In ont_v1, we are not supporting backgrounds for nanopore mngs samples,
      # so precache the report without any backgrounds.
      cache_key = PipelineReportService.report_info_cache_key(
        "/samples/#{sample.id}/report_v2.json", params
      )
      Rails.logger.info("Precaching #{cache_key}")
      Rails.cache.fetch(cache_key, expires_in: 30.days) do
        PipelineReportService.call(self, nil)
      end

      MetricUtil.log_analytics_event(EventDictionary::PIPELINE_REPORT_PRECACHED, nil)
    else
      Background.top_for_sample(sample).pluck(:id).each do |background_id|
        cache_key = PipelineReportService.report_info_cache_key(
          "/samples/#{sample.id}/report_v2.json",
          params.merge(background_id: background_id)
        )
        Rails.logger.info("Precaching #{cache_key} with background #{background_id}")
        Rails.cache.fetch(cache_key, expires_in: 30.days) do
          PipelineReportService.call(self, background_id)
        end

        MetricUtil.log_analytics_event(EventDictionary::PIPELINE_REPORT_PRECACHED, nil)
      end
    end
  end

  def rpm(raw_read_count)
    raw_read_count / ((total_reads - (total_ercc_reads || 0).to_i) * subsample_fraction) * 1_000_000.0
  end

  def bpm(raw_bases_count)
    raw_bases_count / (total_bases * fraction_subsampled_bases) * 1_000_000.0
  end

  def load_compression_ratio(job_stats_hash)
    # job_stats_hash['cdhitdup_out'] required for backwards compatibility
    czid_dedup_stats = job_stats_hash['czid_dedup_out'] || job_stats_hash['idseq_dedup_out'] || job_stats_hash['cdhitdup_out']
    priceseq_stats = job_stats_hash['priceseq_out']
    # use human if it exists, otherwise use host.
    hisat2_stats = job_stats_hash['hisat2_human_filtered_out'] || job_stats_hash['hisat2_host_filtered_out']

    if pipeline_version_uses_new_host_filtering_stage(pipeline_version)
      update!(compression_ratio: (1.0 * hisat2_stats['reads_after']) / czid_dedup_stats['reads_after']) unless hisat2_stats.nil? || czid_dedup_stats.nil? || czid_dedup_stats['reads_after'].zero?
    else
      update!(compression_ratio: (1.0 * priceseq_stats['reads_after']) / czid_dedup_stats['reads_after']) unless czid_dedup_stats.nil? || priceseq_stats.nil? || czid_dedup_stats['reads_after'].zero?
    end
  end

  def load_qc_percent(job_stats_hash)
    if technology == PipelineRun::TECHNOLOGY_INPUT[:nanopore]
      quality_filtered_stats = job_stats_hash['quality_filtered_reads']
      validated_stats = job_stats_hash['validated_reads']
      update!(qc_percent: calculate_qc_percent(validated_stats['reads_after'], quality_filtered_stats['reads_after'])) unless quality_filtered_stats.nil? || validated_stats.nil? || validated_stats['reads_after'].zero?
    else
      star_stats = job_stats_hash['star_out']
      priceseqfilter_stats = job_stats_hash['priceseq_out']

      fastp_stats = job_stats_hash['fastp_out']
      validate_input_stats = job_stats_hash['validate_input_out']
      bowtie2_ercc_stats = job_stats_hash['bowtie2_ercc_filtered_out']

      if pipeline_version_calculates_erccs_before_quality_filtering(pipeline_version)
        update!(qc_percent: (100.0 * fastp_stats['reads_after']) / bowtie2_ercc_stats['reads_after']) unless fastp_stats.nil? || bowtie2_ercc_stats.nil? || bowtie2_ercc_stats['reads_after'].zero?
      elsif pipeline_version_uses_new_host_filtering_stage(pipeline_version)
        update!(qc_percent: (100.0 * fastp_stats['reads_after']) / validate_input_stats['reads_after']) unless fastp_stats.nil? || validate_input_stats.nil? || validate_input_stats['reads_after'].zero?
      else
        update!(qc_percent: (100.0 * priceseqfilter_stats['reads_after']) / star_stats['reads_after']) unless priceseqfilter_stats.nil? || star_stats.nil? || star_stats['reads_after'].zero?
      end
    end
  end

  # Given a list of samples, returns a list of the latest pipeline run for each of the samples.
  def self.latest_by_sample(samples)
    dates = PipelineRun.select("sample_id, MAX(created_at) as created_at").where(sample: samples).group(:sample_id)
    return where("(sample_id, created_at) IN (?)", dates)
  end

  def fetch_total_count_by_technology
    if technology == TECHNOLOGY_INPUT[:illumina]
      total_reads
    elsif technology == TECHNOLOGY_INPUT[:nanopore]
      total_bases
    end
  end

  def fetch_adjusted_total_count_by_technology
    if technology == TECHNOLOGY_INPUT[:illumina]
      (total_reads - total_ercc_reads.to_i) * subsample_fraction
    elsif technology == TECHNOLOGY_INPUT[:nanopore]
      total_bases
    end
  end

  def call_pipeline_data_service(show_experimental, remove_host_filtering_urls)
    if technology == TECHNOLOGY_INPUT[:illumina]
      SfnPipelineDataService.call(id, show_experimental, remove_host_filtering_urls)
    elsif technology == TECHNOLOGY_INPUT[:nanopore]
      SfnSingleStagePipelineDataService.call(id, technology)
    end
  end

  def lineage_map_by_taxid(taxid_list)
    taxon_lineage_map = {}
    lineage_version = alignment_config.lineage_version
    TaxonLineage.versioned_lineages(taxid_list.uniq, lineage_version).each { |t| taxon_lineage_map[t.taxid.to_i] = t.to_a }
    return taxon_lineage_map
  end

  private

  def cleanup_relations
    TaxonByterange.where(pipeline_run_id: id).delete_all
    TaxonCount.where(pipeline_run_id: id).delete_all
    Contig.where(pipeline_run_id: id).delete_all
    AmrCount.where(pipeline_run_id: id).delete_all
    ErccCount.where(pipeline_run_id: id).delete_all
    JobStat.where(pipeline_run_id: id).delete_all
    bulk_downloads.each(&:destroy!)
    phylo_trees.each(&:destroy!)
    phylo_tree_ngs.each(&:destroy!)
  end

  def calculate_qc_percent(before_qc, after_qc)
    (100.0 * after_qc) / before_qc
  end

  def extract_float_metric(metrics, metric_name)
    return nil unless metrics[metric_name]

    return metrics[metric_name].to_f
  end

  def extract_int_metric(metrics, metric_name)
    return nil unless metrics[metric_name]

    return metrics[metric_name].to_i
  end

  def format_job_status_text(step_number, name, job_status, report_ready_flag)
    "#{step_number}.#{name}-#{job_status}" + (report_ready_flag ? "|#{STATUS_READY}" : "")
  end

  def pipeline_run_stage_error_message(prs, automatic_restart, known_user_error)
    reads_remaining_text = adjusted_remaining_reads ? "with #{adjusted_remaining_reads} reads remaining " : ""
    automatic_restart_text = automatic_restart ? "Automatic restart is being triggered. " : "** Manual action required **. "
    known_user_error = known_user_error ? "Known user error #{known_user_error}. " : ""

    "SampleFailedEvent: Sample #{sample.id} by #{sample.user.role_name} failed #{prs.step_number}-#{prs.name} #{reads_remaining_text}" \
      "after #{duration_hrs} hours. #{automatic_restart_text}#{known_user_error}"\
      "See: #{status_url}. "\
      "SFN execution ARN: `#{sfn_execution_arn}`"
  end

  def report_failed_pipeline_run_stage(prs, known_user_error, automatic_restart = false)
    log_message = pipeline_run_stage_error_message(prs, automatic_restart, known_user_error)
    Rails.logger.error(log_message)
  end

  def supports_assembly?
    technology == TECHNOLOGY_INPUT[:nanopore] || pipeline_version_has_assembly(pipeline_version)
  end

  def time_since_executed_at
    if executed_at
      Time.now.utc - executed_at  # seconds
    end
  end

  def sfn_execution
    s3_path = s3_output_prefix || sample.sample_output_s3_path

    @sfn_execution ||= SfnExecution.new(execution_arn: sfn_execution_arn, s3_path: s3_path, finalized: finalized?)
  end

  def input_error
    sfn_error, sfn_error_message = sfn_execution.pipeline_error

    if WorkflowRun::INPUT_ERRORS.include?(sfn_error)
      return {
        label: sfn_error,
        message: sfn_error_message,
      }
    end
  end
end
