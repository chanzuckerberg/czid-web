require 'open3'
require 'json'
require 'tempfile'
require 'aws-sdk'

class Sample < ApplicationRecord
  STATUS_CREATED = 'created'.freeze
  STATUS_UPLOADED = 'uploaded'.freeze
  STATUS_RERUN    = 'need_rerun'.freeze
  STATUS_RETRY_PR = 'retry_pr'.freeze # retry existing pipeline run
  STATUS_CHECKED = 'checked'.freeze # status regarding pipeline kickoff is checked
  MULTIHIT_FASTA_BASENAME = 'accessions.rapsearch2.gsnapl.fasta'.freeze
  HIT_FASTA_BASENAME = 'taxids.rapsearch2.filter.deuterostomes.taxids.gsnapl.unmapped.bowtie2.lzw.cdhitdup.priceseqfilter.unmapped.star.fasta'.freeze
  DAG_ANNOTATED_FASTA_BASENAME = 'annotated_merged.fa'.freeze
  DAG_UNIDENTIFIED_FASTA_BASENAME = 'unidentified.fa'.freeze
  UNIDENTIFIED_FASTA_BASENAME = 'unidentified.fasta'.freeze
  SORTED_TAXID_ANNOTATED_FASTA = 'taxid_annot_sorted_nt.fasta'.freeze
  SORTED_TAXID_ANNOTATED_FASTA_NR = 'taxid_annot_sorted_nr.fasta'.freeze
  SORTED_TAXID_ANNOTATED_FASTA_GENUS_NT = 'taxid_annot_sorted_genus_nt.fasta'.freeze
  SORTED_TAXID_ANNOTATED_FASTA_GENUS_NR = 'taxid_annot_sorted_genus_nr.fasta'.freeze
  SORTED_TAXID_ANNOTATED_FASTA_FAMILY_NT = 'taxid_annot_sorted_family_nt.fasta'.freeze
  SORTED_TAXID_ANNOTATED_FASTA_FAMILY_NR = 'taxid_annot_sorted_family_nr.fasta'.freeze
  TOTAL_READS_JSON = "total_reads.json".freeze

  LOG_BASENAME = 'log.txt'.freeze

  LOCAL_INPUT_PART_PATH = '/app/tmp/input_parts'.freeze

  # TODO: Make all these params configurable without code change
  DEFAULT_STORAGE_IN_GB = 1000
  DEFAULT_MEMORY_IN_MB = 120_000 # sorry, hacky
  HOST_FILTERING_MEMORY_IN_MB = 240_000

  DEFAULT_QUEUE = 'idseq'.freeze
  DEFAULT_VCPUS = 16

  DEFAULT_QUEUE_HIMEM = 'idseq_himem'.freeze
  DEFAULT_VCPUS_HIMEM = 32

  # These zombies keep coming back, so we now expressly fail submissions to them.
  DEPRECATED_QUEUES = %w[idseq_alpha_stg1 aegea_batch_ondemand idseq_production_high_pri_stg1].freeze

  METADATA_FIELDS = [:sample_unique_id, # 'Unique ID' (e.g. in human case, patient ID)
                     :sample_location, :sample_date, :sample_tissue,
                     :sample_template, # this refers to nucleotide type (RNA or DNA)
                     :sample_library, :sample_sequencer, :sample_notes, :sample_input_pg, :sample_batch, :sample_diagnosis, :sample_organism, :sample_detection].freeze

  attr_accessor :bulk_mode

  belongs_to :project
  belongs_to :user, optional: true # This is the user who uploaded the sample, possibly distinct from the user(s) owning the sample's project
  belongs_to :host_genome, optional: true
  has_many :pipeline_runs, -> { order(created_at: :desc) }, dependent: :destroy
  has_and_belongs_to_many :backgrounds, through: :pipeline_runs
  has_many :input_files, dependent: :destroy
  accepts_nested_attributes_for :input_files
  validate :input_files_checks
  after_create :initiate_input_file_upload
  validates :name, uniqueness: { scope: :project_id }

  before_save :check_host_genome, :concatenate_input_parts, :check_status
  after_save :set_presigned_url_for_local_upload

  # Error on trying to save string values to float
  validates :sample_input_pg, :sample_batch, numericality: true, allow_nil: true

  # getter
  attr_reader :bulk_mode

  # setter
  attr_writer :bulk_mode

  def sample_path
    File.join('samples', project_id.to_s, id.to_s)
  end

  def pipeline_versions
    prvs = []
    pipeline_runs.each do |pr|
      next if pr.completed? && pr.taxon_counts.empty?
      prvs << (pr.pipeline_version.nil? ? PipelineRun::PIPELINE_VERSION_WHEN_NULL : pr.pipeline_version)
    end
    prvs.uniq
  end

  def pipeline_run_by_version(pipeline_version)
    # Right now we don't filter for successful pipeline runs. we should do that at some point.
    prs = if pipeline_version == PipelineRun::PIPELINE_VERSION_WHEN_NULL
            pipeline_runs.where(pipeline_version: nil)
          else
            pipeline_runs.where(pipeline_version: pipeline_version)
          end

    prs.each { |pr| return pr unless pr.taxon_counts.empty? }
    prs.first
  end

  validates_associated :input_files

  def input_files_checks
    # validate that we have the correct number of input files
    errors.add(:input_files, "no input files") unless input_files.size.between?(1, 2)
    # validate that both input files have the same source_type and file_type
    if input_files.length == 2
      errors.add(:input_files, "file source type different") unless input_files[0].source_type == input_files[1].source_type
      errors.add(:input_files, "file formats different") unless input_files[0].file_type == input_files[1].file_type
      if input_files[0].source == input_files[1].source
        errors.add(:input_files, "read 1 source and read 2 source are identical")
      end
    end
    # TODO: for s3 input types, test permissions before saving, by making a HEAD request
  end

  def set_presigned_url_for_local_upload
    input_files.each do |f|
      if f.source_type == 'local' && f.parts
        # TODO: investigate the content-md5 stuff https://github.com/aws/aws-sdk-js/issues/151 https://gist.github.com/algorist/385616
        parts = f.parts.split(", ")
        presigned_urls = parts.map do |part|
          S3_PRESIGNER.presigned_url(:put_object, expires_in: 86_400, bucket: SAMPLES_BUCKET_NAME,
                                                  key: File.join(File.dirname(f.file_path), File.basename(part)))
        end
        f.update(presigned_url: presigned_urls.join(", "))
      end
    end
  end

  def self.search(search)
    if search
      where('samples.name LIKE :search
        OR samples.sample_tissue LIKE :search
        OR samples.sample_location LIKE :search
        OR samples.sample_notes LIKE :search
        OR samples.sample_unique_id', search: "%#{search}%")
    else
      scoped
    end
  end

  def self.get_signed_url(s3key)
    begin
      if s3key.present?
        return S3_PRESIGNER.presigned_url(:get_object,
                                          bucket: SAMPLES_BUCKET_NAME, key: s3key,
                                          expires_in: SAMPLE_DOWNLOAD_EXPIRATION).to_s
      end
    rescue StandardError => e
      Airbrake.notify("AWS presign error: #{e.inspect}")
    end
    nil
  end

  def end_path(key, n = 1)
    parts = key.split('/')
    n == 2 ? "#{parts[-2]}/#{parts[-1]}" : parts[-1]
  end

  def list_outputs(s3_path, display_prefix = 1)
    prefix = s3_path.split("#{Sample::SAMPLES_BUCKET_NAME}/")[1]
    file_list = S3_CLIENT.list_objects(bucket: SAMPLES_BUCKET_NAME,
                                       prefix: "#{prefix}/",
                                       delimiter: "/")
    file_list.contents.map do |f|
      {
        key: f.key,
        display_name: end_path(f.key, display_prefix),
        url: Sample.get_signed_url(f.key),
        size: ActiveSupport::NumberHelper.number_to_human_size(f.size)
      }
    end
  end

  def results_folder_files
    pr = pipeline_runs.first
    return list_outputs(sample_output_s3_path) unless pr
    file_list = []
    if pr.pipeline_version.to_f >= 2.0
      file_list = list_outputs(pr.output_s3_path_with_version)
      file_list += list_outputs(sample_output_s3_path)
    else
      stage1_files = list_outputs(pr.host_filter_output_s3_path)
      stage2_files = list_outputs(pr.alignment_output_s3_path, 2)
      file_list = stage1_files + stage2_files
    end
    file_list
  end

  def fastqs_folder_files
    list_outputs(sample_input_s3_path)
  end

  def adjust_extensions
    input_files.each do |input_file|
      # change extension to one allowed by the pipeline
      basename = File.basename(input_file.source)
      basename.sub!(/fq\z/, "fastq")
      basename.sub!(/fq.gz\z/, "fastq.gz")
      basename.sub!(/fa\z/, "fasta")
      basename.sub!(/fa.gz\z/, "fasta.gz")
      input_file.update(name: basename)
    end
  end

  def initiate_input_file_upload
    adjust_extensions
    return unless input_files.first.source_type == InputFile::SOURCE_TYPE_S3
    Resque.enqueue(InitiateS3Cp, id)
  end

  def initiate_s3_cp
    return unless status == STATUS_CREATED
    stderr_array = []
    total_reads_json_path = nil
    max_lines = PipelineRun::MAX_INPUT_FRAGMENTS * 4
    input_files.each do |input_file|
      fastq = input_file.source
      total_reads_json_path = File.join(File.dirname(fastq.to_s), TOTAL_READS_JSON)

      input_file.name = input_file.name.sub(".fq", ".fastq")

      command = if fastq =~ /\.gz/
                  "aws s3 cp #{fastq} - |gzip -dc |head -#{max_lines} | gzip -c | aws s3 cp - #{sample_input_s3_path}/#{input_file.name}"
                else
                  "aws s3 cp #{fastq} #{sample_input_s3_path}/#{input_file.name}"
                end
      _stdout, stderr, status = Open3.capture3(command)
      stderr_array << stderr unless status.exitstatus.zero?
    end
    if total_reads_json_path.present?
      # For samples where we are only given fastas post host filtering, we need to input the total reads (before host filtering) from this file.
      _stdout, _stderr, status = Open3.capture3("aws", "s3", "cp", total_reads_json_path, "#{sample_input_s3_path}/#{TOTAL_READS_JSON}")
      # We don't have a good way to know if this file should be present or not, so we just try to upload it
      # and if it fails, we try one more time;  if that fails too, it's okay, the file is optional.
      unless status.exitstatus.zero?
        sleep(1.0)
        _stdout, _stderr, _status = Open3.capture3("aws", "s3", "cp", total_reads_json_path, "#{sample_input_s3_path}/#{TOTAL_READS_JSON}")
      end
    end
    if s3_preload_result_path.present? && s3_preload_result_path[0..4] == 's3://'
      _stdout, stderr, status = Open3.capture3("aws", "s3", "cp", s3_preload_result_path.to_s, sample_output_s3_path.to_s, "--recursive")
      stderr_array << stderr unless status.exitstatus.zero?
    end
    unless stderr_array.empty?
      Airbrake.notify("Failed to upload sample #{id} with error #{stderr_array[0]}")
      raise stderr_array[0]
    end

    self.status = STATUS_UPLOADED
    save # this triggers pipeline command
  end

  def sample_input_s3_path
    "s3://#{SAMPLES_BUCKET_NAME}/#{sample_path}/fastqs"
  end

  def filter_host_flag
    host_genome && host_genome.name == HostGenome::NO_HOST_NAME ? 0 : 1
  end

  def skip_deutero_filter_flag
    !host_genome || host_genome.skip_deutero_filter == 1 ? 1 : 0
  end

  def sample_output_s3_path
    "s3://#{SAMPLES_BUCKET_NAME}/#{sample_path}/results"
  end

  def sample_alignment_output_s3_path
    pr = pipeline_runs.first
    return pr.alignment_output_s3_path
  rescue
    return sample_output_s3_path
  end

  def sample_host_filter_output_s3_path
    pr = pipeline_runs.first
    return pr.host_filter_output_s3_path
  rescue
    return sample_output_s3_path
  end

  def subsample_suffix
    pr = pipeline_runs.first
    pr.subsample_suffix
  end

  def sample_postprocess_s3_path
    "s3://#{SAMPLES_BUCKET_NAME}/#{sample_path}/postprocess"
  end

  def annotated_fasta_s3_path
    pr = pipeline_runs.first
    return "#{pr.output_s3_path_with_version}/#{DAG_ANNOTATED_FASTA_BASENAME}" if pr.pipeline_version && pr.pipeline_version.to_f >= 2.0

    pr.multihit? ? "#{sample_alignment_output_s3_path}/#{MULTIHIT_FASTA_BASENAME}" : "#{sample_alignment_output_s3_path}/#{HIT_FASTA_BASENAME}"
  end

  def unidentified_fasta_s3_path
    pr = pipeline_runs.first
    return "#{pr.output_s3_path_with_version}/#{DAG_UNIDENTIFIED_FASTA_BASENAME}" if pr.pipeline_version && pr.pipeline_version.to_f >= 2.0
    "#{sample_alignment_output_s3_path}/#{UNIDENTIFIED_FASTA_BASENAME}"
  end

  def host_genome_name
    host_genome.name if host_genome
  end

  def default_background_id
    host_genome && host_genome.default_background ? host_genome.default_background.id : Background.find_by(project_id: nil).id
  end

  def as_json(_options = {})
    super(methods: [:input_files, :host_genome_name])
  end

  def check_host_genome
    if host_genome.present?
      self.s3_star_index_path = host_genome.s3_star_index_path
      self.s3_bowtie2_index_path = host_genome.s3_bowtie2_index_path
      self.sample_memory ||= HOST_FILTERING_MEMORY_IN_MB
    end
    s3_preload_result_path ||= ''
    s3_preload_result_path.strip!
  end

  def concatenate_input_parts
    return unless status == STATUS_UPLOADED
    begin
      input_files.each do |f|
        next unless f.source_type == 'local'
        parts = f.parts.split(", ")
        next unless parts.length > 1
        source_parts = []
        local_path = "#{LOCAL_INPUT_PART_PATH}/#{id}/#{f.id}"
        parts.each_with_index do |part, index|
          source_part = File.join("s3://#{SAMPLES_BUCKET_NAME}", File.dirname(f.file_path), File.basename(part))
          source_parts << source_part
          `aws s3 cp #{source_part} #{local_path}/#{index}`
        end
        `cd #{local_path}; cat * > complete_file; aws s3 cp complete_file s3://#{SAMPLES_BUCKET_NAME}/#{f.file_path}`
        `rm -rf #{local_path}`
        source_parts.each do |source_part|
          `aws s3 rm #{source_part}`
        end
      end
    rescue
      Airbrake.notify("Failed to concatenate input parts for sample #{id}")
    end
  end

  def check_status
    return unless [STATUS_UPLOADED, STATUS_RERUN, STATUS_RETRY_PR].include?(status)
    pr = pipeline_runs.first
    transient_status = status
    self.status = STATUS_CHECKED

    if transient_status == STATUS_RETRY_PR && pr
      pr.retry
    else
      kickoff_pipeline
    end
  end

  def self.viewable(user)
    if user.admin?
      all
    else
      project_ids = Project.editable(user).select("id").pluck(:id)
      joins("INNER JOIN projects ON samples.project_id = projects.id")
        .where("(project_id in (?) or
                projects.public_access = 1 or
                DATE_ADD(samples.created_at, INTERVAL projects.days_to_keep_sample_private DAY) < ?)",
               project_ids, Time.current)
    end
  end

  def self.editable(user)
    if user.admin?
      all
    else
      project_ids = Project.editable(user).select("id").pluck(:id)
      where("project_id in (?)", project_ids)
    end
  end

  def self.public_samples
    joins("INNER JOIN projects ON samples.project_id = projects.id")
      .where("(projects.public_access = 1 or
              DATE_ADD(samples.created_at, INTERVAL projects.days_to_keep_sample_private DAY) < ?)",
             Time.current)
  end

  def archive_old_pipeline_runs
    old_pipeline_runs = pipeline_runs.order('id desc').offset(1)
    old_pipeline_runs.each do |pr|
      # Write pipeline_run data to file
      json_output = pr.to_json(include: [:pipeline_run_stages,
                                         :taxon_counts,
                                         :taxon_byteranges,
                                         :job_stats])
      file = Tempfile.new
      file.write(json_output)
      file.close
      # Copy file to S3
      pr_s3_file_name = "pipeline_run_#{pr.id}.json"
      _stdout, _stderr, status = Open3.capture3("aws", "s3", "cp", file.path.to_s,
                                                "#{pr.archive_s3_path}/#{pr_s3_file_name}")
      # Delete any taxon_counts / taxon_byteranges associated with the pipeline run
      if !File.zero?(file.path) && status.exitstatus && status.exitstatus.zero?
        TaxonCount.where(pipeline_run_id: pr.id).delete_all
        TaxonByterange.where(pipeline_run_id: pr.id).delete_all
      end
      file.unlink
    end
  end

  def reload_old_pipeline_runs
    old_pipeline_runs = pipeline_runs.order('id desc').offset(1)
    old_pipeline_runs.each do |pr|
      next unless pr.succeeded?
      next unless pr.taxon_counts.empty?
      pr_s3_file_name = "#{pr.archive_s3_path}/pipeline_run_#{pr.id}.json"
      pr_local_file_name = PipelineRun.download_file(pr_s3_file_name, pr.local_json_path)
      next unless pr_local_file_name
      json_dict = JSON.parse(File.read(pr_local_file_name))
      json_dict = json_dict["pipeline_output"] if json_dict["pipeline_output"]
      taxon_counts = (json_dict["taxon_counts"] || {}).map do |txn|
        txn.slice("tax_id", "tax_level", "count", "created_at", "name", "count_type", "percent_identity", "alignment_length", "e_value", "genus_taxid", "superkingdom_taxid", "percent_concordant", "species_total_concordant", "genus_total_concordant", "family_total_concordant", "common_name", "family_taxid", "is_phage")
      end
      taxon_byteranges = (json_dict["taxon_byteranges"] || {}).map do |txn|
        txn.slice("taxid", "first_byte", "last_byte", "created_at", "hit_type", "tax_level")
      end

      pr.taxon_counts_attributes = taxon_counts unless taxon_counts.empty?
      pr.taxon_byteranges_attributes = taxon_byteranges unless taxon_byteranges.empty?
      pr.save
    end
  end

  def kickoff_pipeline
    # only kickoff pipeline when no active pipeline_run running
    return unless pipeline_runs.in_progress.empty?

    pr = PipelineRun.new
    pr.sample = self
    pr.subsample = PipelineRun::DEFAULT_SUBSAMPLING # if subsample != 0 ALLWAYS SUBSAMPLE
    # The subsample field of "sample" is currently used as a simple flag (UI checkbox),
    # but was made an integer type in case we want to allow users to enter the desired number
    # of reads to susbample to in the future
    pr.pipeline_branch = pipeline_branch.blank? ? "master" : pipeline_branch
    pr.pipeline_commit = `git ls-remote https://github.com/chanzuckerberg/idseq-dag.git | grep refs/heads/#{pr.pipeline_branch}`.split[0]

    pr.alignment_config = AlignmentConfig.find_by(name: alignment_config_name) if alignment_config_name
    pr.alignment_config ||= AlignmentConfig.find_by(name: AlignmentConfig::DEFAULT_NAME)
    pr.save
  end
end
