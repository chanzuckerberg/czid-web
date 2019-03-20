require 'open3'
require 'json'
require 'tempfile'
require 'aws-sdk'
require 'elasticsearch/model'
# TODO(mark): Move to an initializer. Make sure this works with Rails auto-reloading.

class Sample < ApplicationRecord
  if ELASTICSEARCH_ON
    include Elasticsearch::Model
    include Elasticsearch::Model::Callbacks
  end
  include TestHelper
  include MetadataHelper

  STATUS_CREATED = 'created'.freeze
  STATUS_UPLOADED = 'uploaded'.freeze
  STATUS_RERUN    = 'need_rerun'.freeze
  STATUS_RETRY_PR = 'retry_pr'.freeze # retry existing pipeline run
  STATUS_CHECKED = 'checked'.freeze # status regarding pipeline kickoff is checked

  TOTAL_READS_JSON = "total_reads.json".freeze
  LOG_BASENAME = 'log.txt'.freeze
  S3_CP_PIPE_ERROR = '[Errno 32] Broken pipe'.freeze

  LOCAL_INPUT_PART_PATH = '/app/tmp/input_parts'.freeze
  ASSEMBLY_DIR = 'assembly'.freeze

  # TODO: Make all these params configurable without code change
  DEFAULT_STORAGE_IN_GB = 1000
  DEFAULT_MEMORY_IN_MB = 120_000 # sorry, hacky
  HIMEM_IN_MB = 240_000

  DEFAULT_QUEUE = (Rails.env == 'prod' ? 'idseq-prod-lomem' : 'idseq-staging-lomem').freeze
  DEFAULT_VCPUS = 16

  DEFAULT_QUEUE_HIMEM = (Rails.env == 'prod' ? 'idseq-prod-himem' : 'idseq-staging-himem').freeze
  DEFAULT_VCPUS_HIMEM = 32

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
  has_many :metadata, dependent: :destroy
  has_and_belongs_to_many :visualizations

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

  def fasta_input?
    ["fasta", "fa", "fasta.gz", "fa.gz"].include?(input_files[0].file_type)
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
    errors.add(:input_files, "invalid number") unless input_files.size.between?(1, 2)
    # validate that both input files have the same source_type and file_type
    if input_files.length == 2
      errors.add(:input_files, "have different source types") unless input_files[0].source_type == input_files[1].source_type
      errors.add(:input_files, "have different file formats") unless input_files[0].file_type == input_files[1].file_type
      if input_files[0].source == input_files[1].source
        errors.add(:input_files, "have identical read 1 source and read 2 source")
      end
    end
  end

  def required_metadata_fields
    # Don't use "where", as this will trigger another SQL query when used inside loops.
    host_genome.metadata_fields.select { |x| x.is_required == 1 }
  end

  def missing_required_metadata_fields
    required_metadata_fields - metadata.map(&:metadata_field)
  end

  def set_presigned_url_for_local_upload
    input_files.each do |f|
      if f.source_type == InputFile::SOURCE_TYPE_LOCAL && f.parts
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

  # Find sample results based on the string searched. Supports direct search on
  # sample attributes and search by pathogen name presence.
  # TODO: Add Metadatum 2.0 and other search capabilities.
  def self.search(search, eligible_pr_ids = [])
    # pipeline_run_ids to restrict the set of pipeline runs to search
    if search
      search = search.strip
      results = where('samples.name LIKE :search
        OR samples.sample_tissue LIKE :search
        OR samples.sample_location LIKE :search
        OR samples.sample_notes LIKE :search
        OR samples.sample_unique_id LIKE :search', search: "%#{search}%")

      unless eligible_pr_ids.empty?
        # Require scope of eligible pipeline runs for pathogen search

        # Get taxids that match the query name at any tax level
        matching_taxids = TaxonLineage.where("tax_name LIKE :search", search: "#{search}%").pluck(:taxid)

        # Get pipeline runs that match the taxids
        matching_pr_ids = TaxonByterange.where(taxid: matching_taxids).pluck(:pipeline_run_id)

        # Filter to the eligible and matching pipeline runs. Used IDs because of
        # some "'id' in IN/ALL/ANY subquery is ambiguous" issue with chained
        # queries.
        filtered_pr_ids = eligible_pr_ids && matching_pr_ids

        # Find the sample ids
        sample_ids = PipelineRun.joins(:sample).where(id: filtered_pr_ids).pluck(:'pipeline_runs.sample_id').uniq
        pathogen_results = where(id: sample_ids)

        results = results.or(pathogen_results)
      end

      results
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
      LogUtil.log_err_and_airbrake("AWS presign error: #{e.inspect}")
    end
    nil
  end

  def end_path(key, n = 1)
    output = []
    parts = key.split('/')
    (1..n).each do |k|
      output.unshift(parts[-k])
    end
    output.join("/")
  end

  def list_outputs(s3_path, display_prefix = 1, delimiter = "/")
    return TEST_RESULT_FOLDER if Rails.env == "test"
    prefix = s3_path.split("#{SAMPLES_BUCKET_NAME}/")[1]
    file_list = S3_CLIENT.list_objects(bucket: SAMPLES_BUCKET_NAME,
                                       prefix: "#{prefix}/",
                                       delimiter: delimiter)
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
      file_list += list_outputs(pr.postprocess_output_s3_path)
      file_list += list_outputs(pr.postprocess_output_s3_path + '/' + ASSEMBLY_DIR)
      file_list += list_outputs(pr.expt_output_s3_path)
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

  def initiate_input_file_upload
    return unless input_files.first.source_type == InputFile::SOURCE_TYPE_S3
    Resque.enqueue(InitiateS3Cp, id)
  end

  def initiate_s3_cp
    return unless status == STATUS_CREATED
    stderr_array = []
    total_reads_json_path = nil
    max_lines = 4 * (max_input_fragments || PipelineRun::DEFAULT_MAX_INPUT_FRAGMENTS)
    input_files.each do |input_file|
      fastq = input_file.source
      total_reads_json_path = File.join(File.dirname(fastq.to_s), TOTAL_READS_JSON)

      command = if fastq =~ /\.gz/
                  "aws s3 cp #{fastq} - |gzip -dc |head -#{max_lines} | gzip -c | aws s3 cp - #{sample_input_s3_path}/#{input_file.name}"
                else
                  "aws s3 cp #{fastq} - | head -#{max_lines} | aws s3 cp - #{sample_input_s3_path}/#{input_file.name}"
                end
      _stdout, stderr, status = Open3.capture3(command)
      unless status.exitstatus.zero? && stderr.empty?
        # HACK: Ignore 'Broken pipe' error because it will always be written to stderr unless you
        # 'head' the entire file. Exitstatus would still be 0 because it is the status of the last
        # command and the intermediate statuses are not checked. We still want to check stderr for
        # errs like HeadObject Forbidden.
        # TODO: Consider refactoring this streaming copy to avoid hacks.
        unless stderr.include?(S3_CP_PIPE_ERROR)
          stderr_array << stderr
        end
      end
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
      LogUtil.log_err_and_airbrake("Failed to upload S3 sample '#{name}' (#{id}): #{stderr_array[0]}")
      raise stderr_array[0]
    end

    self.status = STATUS_UPLOADED
    save # this triggers pipeline command
  rescue => e
    LogUtil.log_err_and_airbrake("Failed to upload S3 sample '#{name}' (#{id}): #{e}")
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

  # This is for the "Experimental" pipeline run stage and path where results
  # for this stage are outputted. Currently, Antimicrobial Resistance
  # outputs are in this path.
  def sample_expt_s3_path
    "s3://#{SAMPLES_BUCKET_NAME}/#{sample_path}/expt"
  end

  def host_genome_name
    host_genome.name if host_genome
  end

  def default_background_id
    host_genome && host_genome.default_background ? host_genome.default_background.id : Background.find_by(public_access: 1).id
  end

  def as_json(options = {})
    options[:methods] ||= [:input_files, :host_genome_name, :private_until]
    super(options)
  end

  def check_host_genome
    if host_genome.present?
      self.s3_star_index_path = host_genome.s3_star_index_path
      self.s3_bowtie2_index_path = host_genome.s3_bowtie2_index_path
    end
    s3_preload_result_path ||= ''
    s3_preload_result_path.strip!
  end

  def concatenate_input_parts
    return unless status == STATUS_UPLOADED
    begin
      input_files.each do |f|
        next unless f.source_type == InputFile::SOURCE_TYPE_LOCAL
        parts = f.parts.split(", ")
        next unless parts.length > 1
        source_parts = []
        local_path = "#{LOCAL_INPUT_PART_PATH}/#{id}/#{f.id}"
        parts.each_with_index do |part, index|
          source_part = File.join("s3://#{SAMPLES_BUCKET_NAME}", File.dirname(f.file_path), File.basename(part))
          source_parts << source_part
          Syscall.run("aws", "s3", "cp", source_part, "#{local_path}/#{index}")
        end
        Syscall.run_in_dir(local_path, "cat * > complete_file")
        Syscall.run_in_dir(local_path, "aws", "s3", "cp", "complete_file", "s3://#{SAMPLES_BUCKET_NAME}/#{f.file_path}")
        Syscall.run("rm", "-rf", local_path)
        source_parts.each do |source_part|
          Syscall.run("aws", "s3", "rm", source_part)
        end
      end
    rescue
      LogUtil.log_err_and_airbrake("Failed to concatenate input parts for sample #{id}")
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

  def destroy
    TaxonByterange.where(pipeline_run_id: pipeline_run_ids).delete_all
    TaxonCount.where(pipeline_run_id: pipeline_run_ids).delete_all
    Contig.where(pipeline_run_id: pipeline_run_ids).delete_all
    super
  end

  def self.viewable(user)
    if user.admin?
      all
    else
      project_ids = Project.editable(user).select("id").pluck(:id)
      joins(:project)
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
      library(user)
    end
  end

  def self.library(user)
    project_ids = Project.library_projects(user).pluck(:id)
    where("project_id in (?)", project_ids)
  end

  def deletable?(user)
    if user.admin?
      true
    elsif user_id == user.id
      # Sample belongs to the user
      # Allow deletion if no pipeline runs, or report failed.
      unless pipeline_runs.empty?
        pipeline_runs.each do |prun|
          return false unless prun.report_failed?
        end
      end
      true
    end
  end

  def self.public_samples
    joins(:project)
      .where("(projects.public_access = 1 OR
              DATE_ADD(samples.created_at, INTERVAL projects.days_to_keep_sample_private DAY) < ?)",
             Time.current)
  end

  def self.private_samples
    joins(:project)
      .where("(projects.public_access = 0 AND
              DATE_ADD(samples.created_at, INTERVAL projects.days_to_keep_sample_private DAY) >= ?)",
             Time.current)
  end

  def self.samples_going_public_in_period(range, user = nil, project = nil)
    query = joins(:project)
            .where("projects.public_access != 1")
            .where("DATE_ADD(samples.created_at, INTERVAL projects.days_to_keep_sample_private DAY) BETWEEN ? AND ?", range[0], range[1])

    query = query.where(user: user) if user
    query = query.where(project: project) if project

    return query
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

  def self.pipeline_commit(branch)
    o = Syscall.pipe(["git", "ls-remote", "https://github.com/chanzuckerberg/idseq-dag.git"], ["grep", "refs/heads/#{branch}"])
    return false if o.blank?
    o.split[0]
  end

  def kickoff_pipeline
    # only kickoff pipeline when no active pipeline_run running
    return unless pipeline_runs.in_progress.empty?

    pr = PipelineRun.new
    pr.sample = self
    pr.subsample = subsample || PipelineRun::DEFAULT_SUBSAMPLING
    pr.max_input_fragments = max_input_fragments || PipelineRun::DEFAULT_MAX_INPUT_FRAGMENTS
    pr.pipeline_branch = pipeline_branch.blank? ? "master" : pipeline_branch
    pr.dag_vars = dag_vars if dag_vars
    pr.pipeline_commit = Sample.pipeline_commit(pr.pipeline_branch)

    pr.alignment_config = AlignmentConfig.find_by(name: alignment_config_name) if alignment_config_name
    pr.alignment_config ||= AlignmentConfig.find_by(name: AlignmentConfig::DEFAULT_NAME)
    pr.save
  end

  def get_existing_metadatum(key)
    return metadata.find { |metadatum| metadatum.metadata_field.name == key || metadatum.metadata_field.display_name == key }
  end

  # Create or update the Metadatum ActiveRecord object, but do not save.
  # This allows us to do this in batch.
  def get_metadatum_to_save(key, val)
    m = get_existing_metadatum(key.to_s)
    unless m
      # Create the entry
      m = Metadatum.new
      m.sample = self

      # Find the appropriate metadata field. First look at existing fields on the project.
      m.metadata_field = get_available_matching_field(self, key.to_s)

      unless m.metadata_field
        # Look for a matching core field.
        core_matching_field = get_matching_core_field(self, key.to_s)

        if core_matching_field
          # Add to the project.
          project.metadata_fields.append(core_matching_field)
          m.metadata_field = core_matching_field
        end
      end

      unless m.metadata_field
        # Create a new custom Metadata Field.
        mf = get_new_custom_field(key.to_s)
        mf.save

        # Add to the project and host genome.
        host_genome.metadata_fields.append(mf)
        project.metadata_fields.append(mf)
        m.metadata_field = mf
      end

      raise RecordNotFound("No matching field for #{key}") unless m.metadata_field
      m.key = m.metadata_field.name
    end
    if val.present? && m.raw_value != val
      m.raw_value = val
      return {
        metadatum: m,
        status: "ok"
      }
    else
      # If the value didn't change or isn't present, don't re-save the metadata field.
      return {
        metadatum: nil,
        status: "ok"
      }
    end
  rescue ActiveRecord::RecordNotFound => e
    Rails.logger.error(e)
    return {
      metadatum: nil,
      status: "error"
    }
  end

  # Add or update metadatum entry on this sample.
  # Returns whether the update succeeded.
  def metadatum_add_or_update(key, val)
    result = get_metadatum_to_save(key, val)

    if result[:status] == "error"
      return false
    elsif result[:metadatum]
      result[:metadatum].save!
    end
    true
  rescue ActiveRecord::RecordInvalid => e
    Rails.logger.error(e)
    false
  end

  # Validate metadatum entry on this sample, without saving.
  def metadatum_validate(key, val)
    m = Metadatum.new
    m.metadata_field = get_available_matching_field(self, key.to_s)

    unless m.metadata_field
      m.metadata_field = get_matching_core_field(self, key.to_s)
    end

    # Only perform this validation if a metadata field was found. Otherwise, we will be creating a custom field which will accept anything.
    if m.metadata_field
      m.key = m.metadata_field.name
      m.sample = self
      m.raw_value = val
    end

    {
      errors: m.valid? ? {} : m.errors,
      # The existing metadata field that was used to validate this metadatum.
      metadata_field: m.metadata_field
    }
  end

  def initiate_s3_prod_sync_to_staging
    return unless Rails.env == 'staging'

    from_path = "s3://idseq-samples-prod/#{sample_path}"
    to_path = "s3://idseq-samples-staging/#{sample_path}"
    Syscall.run("aws", "s3", "cp", "--recursive", from_path, to_path)
  end

  def private_until
    return created_at + project.days_to_keep_sample_private.days
  end

  # Get Metadata objects augmented with MetadataField.base_type
  def metadata_with_base_type
    metadata.map do |m|
      m.attributes.merge(
        "base_type" => Metadatum.convert_type_to_string(m.metadata_field.base_type)
      )
    end
  end

  # Get field info for fields that are appropriate for both the project and the host genome
  def metadata_fields_info
    (project.metadata_fields & host_genome.metadata_fields).map(&:field_info)
  end
end
