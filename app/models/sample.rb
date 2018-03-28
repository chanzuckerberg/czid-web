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
  HIT_FASTA_BASENAME = 'taxids.rapsearch2.filter.deuterostomes.taxids.gsnapl.unmapped.bowtie2.lzw.cdhitdup.priceseqfilter.unmapped.star.fasta'.freeze
  UNIDENTIFIED_FASTA_BASENAME = 'unidentified.fasta'.freeze
  SORTED_TAXID_ANNOTATED_FASTA = 'taxid_annot_sorted_nt.fasta'.freeze
  SORTED_TAXID_ANNOTATED_FASTA_NR = 'taxid_annot_sorted_nr.fasta'.freeze
  SORTED_TAXID_ANNOTATED_FASTA_GENUS_NT = 'taxid_annot_sorted_genus_nt.fasta'.freeze
  SORTED_TAXID_ANNOTATED_FASTA_GENUS_NR = 'taxid_annot_sorted_genus_nr.fasta'.freeze
  SORTED_TAXID_ANNOTATED_FASTA_FAMILY_NT = 'taxid_annot_sorted_family_nt.fasta'.freeze
  SORTED_TAXID_ANNOTATED_FASTA_FAMILY_NR = 'taxid_annot_sorted_family_nr.fasta'.freeze

  LOG_BASENAME = 'log.txt'.freeze

  LOCAL_INPUT_PART_PATH = '/app/tmp/input_parts'.freeze

  # TODO: Make all these params configurable without code change
  DEFAULT_STORAGE_IN_GB = 500
  DEFAULT_MEMORY_IN_MB = 30_000
  HOST_FILTERING_MEMORY_IN_MB = 60_000

  DEFAULT_QUEUE = 'idseq'.freeze
  DEFAULT_VCPUS = 4

  DEFAULT_QUEUE_HIMEM = 'idseq_himem'.freeze
  DEFAULT_VCPUS_HIMEM = 32

  # These zombies keep coming back, so we now expressly fail submissions to them.
  DEPRECATED_QUEUES = %w[idseq_alpha_stg1 aegea_batch_ondemand idseq_production_high_pri_stg1].freeze

  METADATA_FIELDS = [:sample_host, # this has been repurposed to be 'Unique ID' (e.g. in human case, patient ID -- nothing to do with host genome)
                     :sample_location, :sample_date, :sample_tissue,
                     :sample_template, # this refers to nucleotide type (RNA or DNA)
                     :sample_library, :sample_sequencer, :sample_notes].freeze

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

  # getter
  attr_reader :bulk_mode

  # setter
  attr_writer :bulk_mode

  def sample_path
    File.join('samples', project_id.to_s, id.to_s)
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
        OR samples.sample_host', search: "%#{search}%")
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
    file_list.contents.map { |f| { key: f.key, display_name: end_path(f.key, display_prefix), url: Sample.get_signed_url(f.key) } }
  end

  def results_folder_files
    pr = pipeline_runs.first
    return list_outputs(sample_output_s3_path) unless pr
    stage1_files = list_outputs(pr.sample_output_s3_path)
    stage2_files = list_outputs(pr.alignment_output_s3_path, 2)
    stage1_files + stage2_files
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
    input_files.each do |input_file|
      fastq = input_file.source
      _stdout, stderr, status = Open3.capture3("aws", "s3", "cp", fastq.to_s, "#{sample_input_s3_path}/#{input_file.name}")
      stderr_array << stderr unless status.exitstatus.zero?
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

  def subsample_suffix
    pr = pipeline_runs.first
    pr.subsample_suffix
  end

  def sample_postprocess_s3_path
    "s3://#{SAMPLES_BUCKET_NAME}/#{sample_path}/postprocess#{subsample_suffix}"
  end

  def s3_paths_for_taxon_byteranges
    # by tax_level and hit_type
    { TaxonCount::TAX_LEVEL_SPECIES => { 'NT' => "#{sample_postprocess_s3_path}/#{SORTED_TAXID_ANNOTATED_FASTA}",
                                         'NR' => "#{sample_postprocess_s3_path}/#{SORTED_TAXID_ANNOTATED_FASTA_NR}" },
      TaxonCount::TAX_LEVEL_GENUS => { 'NT' => "#{sample_postprocess_s3_path}/#{SORTED_TAXID_ANNOTATED_FASTA_GENUS_NT}",
                                       'NR' => "#{sample_postprocess_s3_path}/#{SORTED_TAXID_ANNOTATED_FASTA_GENUS_NR}" },
      TaxonCount::TAX_LEVEL_FAMILY => { 'NT' => "#{sample_postprocess_s3_path}/#{SORTED_TAXID_ANNOTATED_FASTA_FAMILY_NT}",
                                        'NR' => "#{sample_postprocess_s3_path}/#{SORTED_TAXID_ANNOTATED_FASTA_FAMILY_NR}" } }
  end

  def annotated_fasta_s3_path
    "#{sample_alignment_output_s3_path}/#{HIT_FASTA_BASENAME}"
  end

  def unidentified_fasta_s3_path
    "#{sample_alignment_output_s3_path}/#{UNIDENTIFIED_FASTA_BASENAME}"
  end

  def sample_annotated_fasta_url
    "https://s3.console.aws.amazon.com/s3/object/#{SAMPLES_BUCKET_NAME}/#{sample_path}/results/#{HIT_FASTA_BASENAME}"
  end

  def sample_unidentified_fasta_url
    "https://s3.console.aws.amazon.com/s3/object/#{SAMPLES_BUCKET_NAME}/#{sample_path}/results/#{UNIDENTIFIED_FASTA_BASENAME}"
  end

  def sample_output_folder_url
    "https://s3.console.aws.amazon.com/s3/buckets/#{SAMPLES_BUCKET_NAME}/#{sample_path}/results/"
  end

  def sample_input_folder_url
    "https://s3.console.aws.amazon.com/s3/buckets/#{SAMPLES_BUCKET_NAME}/#{sample_path}/fastqs/"
  end

  def host_genome_name
    host_genome.name if host_genome
  end

  def default_background_id
    host_genome && host_genome.default_background ? host_genome.default_background.id : Background.first.id
  end

  def as_json(_options = {})
    super(methods: [:sample_input_folder_url, :sample_output_folder_url, :sample_annotated_fasta_url, :input_files,
                    :sample_unidentified_fasta_url, :host_genome_name])
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

  def kickoff_pipeline
    # only kickoff pipeline when no active pipeline_run running
    return unless pipeline_runs.in_progress.empty?

    pr = PipelineRun.new
    pr.sample = self
    pr.subsample = PipelineRun::DEFAULT_SUBSAMPLING if subsample != 0
    # The subsample field of "sample" is currently used as a simple flag (UI checkbox),
    # but was made an integer type in case we want to allow users to enter the desired number
    # of reads to susbample to in the future
    pr.pipeline_branch = pipeline_branch.blank? ? "master" : pipeline_branch
    pr.save

    archive_old_pipeline_runs
  end
end
