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
  accepts_nested_attributes_for :taxon_counts
  accepts_nested_attributes_for :job_stats
  accepts_nested_attributes_for :taxon_byteranges

  DEFAULT_SUBSAMPLING = 1_000_000 # number of reads to subsample to, after host filtering
  OUTPUT_JSON_NAME = 'idseq_web_sample.json'.freeze
  STATS_JSON_NAME = 'stats.json'.freeze
  VERSION_JSON_NAME = 'versions.json'.freeze
  TAXID_BYTERANGE_JSON_NAME = 'taxid_locations_combined.json'.freeze
  LOCAL_JSON_PATH = '/app/tmp/results_json'.freeze
  STATUS_CHECKED = 'CHECKED'.freeze
  STATUS_SUCCESS = 'SUCCEEDED'.freeze
  STATUS_FAILED = 'FAILED'.freeze
  STATUS_RUNNING = 'RUNNING'.freeze
  STATUS_RUNNABLE = 'RUNNABLE'.freeze
  STATUS_ERROR = 'ERROR'.freeze # when aegea batch describe failed
  STATUS_LOADED = 'LOADED'.freeze
  POSTPROCESS_STATUS_LOADED = 'LOADED'.freeze

  before_create :create_run_stages
  before_save :check_job_status
  after_create :kickoff_job

  def as_json(_options = {})
    super(except: [:command, :command_stdout, :command_error, :job_description])
  end

  def check_box_label
    "#{sample.project.name} : #{sample.name} (#{id})"
  end

  def archive_s3_path
    "s3://#{SAMPLES_BUCKET_NAME}/pipeline_runs/#{id}_sample#{sample.id}"
  end

  def self.in_progress
    where("job_status != '#{STATUS_FAILED}' OR job_status IS NULL")
      .where(finalized: 0)
  end

  def finalized?
    finalized == 1
  end

  def failed?
    /FAILED/ =~ job_status
  end

  def kickoff_job
    pipeline_run_stages.first.run_job
  end

  def create_run_stages
    # Host Filtering
    run_stages = []
    unless sample.host_genome && sample.host_genome.name == HostGenome::NO_HOST_NAME
      run_stages << PipelineRunStage.new(
        step_number: 1,
        name: 'Host Filtering',
        job_command_func: 'host_filtering_command',
        load_db_command_func: 'db_load_host_filtering',
        output_func: 'host_filtering_outputs'
      )
    end

    # Alignment and Merging
    run_stages << PipelineRunStage.new(
      step_number: 2,
      name: 'GSNAPL/RAPSEARCH alignment',
      job_command_func: 'alignment_command',
      load_db_command_func: 'db_load_alignment',
      output_func: 'alignment_outputs'
    )
    # Post Processing
    run_stages << PipelineRunStage.new(
      step_number: 3,
      name: 'Post Processing',
      job_command_func: 'postprocess_command',
      load_db_command_func: 'db_load_postprocess',
      output_func: 'postprocess_outputs'
    )
    self.pipeline_run_stages = run_stages
  end

  def check_job_status
    # only update the pipeline_run info. do not update pipeline_run_stage info
    return if finalized? || id.nil?
    pipeline_run_stages.order(:step_number).each do |prs|
      if prs.failed?
        self.finalized = 1
        self.job_status = "#{prs.step_number}.#{prs.name}-#{STATUS_FAILED}"
        Airbrake.notify("Sample #{sample.id} failed #{prs.name}")
        return nil
      elsif prs.succeeded?
        next
      else # still running
        self.job_status = "#{prs.step_number}.#{prs.name}-#{prs.job_status}"
        return nil
      end
    end
    # All done
    self.finalized = 1
    self.job_status = STATUS_CHECKED
  end

  def output_ready?
    output_json_s3_path = "#{sample.sample_output_s3_path}/#{OUTPUT_JSON_NAME}"
    stats_json_s3_path = "#{sample.sample_output_s3_path}/#{STATS_JSON_NAME}"
    byteranges_json_s3_path = "#{sample.sample_postprocess_s3_path}/#{TAXID_BYTERANGE_JSON_NAME}"
    # check the existence of all 3 and make sure they are all generated after pr.created_at
    file_generated_since_run(output_json_s3_path) && file_generated_since_run(stats_json_s3_path) && file_generated_since_run(byteranges_json_s3_path)
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

  def update_job_status
    pipeline_run_stages.order(:step_number).each do |prs|
      if !prs.started? # Not started yet
        prs.run_job
        break
      elsif prs.succeeded?
        # great do nothing. go to the next step.
        next
      elsif prs.failed?
        break
      else # This step is still running
        prs.update_job_status
        break
      end
    end
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

  def terminate_job
    command = "aegea batch terminate #{job_id}"
    _stdout, _stderr, _status = Open3.capture3(command)
  end

  def generate_aggregate_counts(tax_level_name)
    current_date = Time.now.utc
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
    %w[species genus].each do |level|
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
    # Make sure to run update_genera after generate_aggregate_counts
    # HACK This should probably have been accomplished with schema DEFAULTs
    TaxonCount.connection.execute("
      UPDATE taxon_counts
      SET taxon_counts.genus_taxid = #{TaxonLineage::MISSING_GENUS_ID},
          taxon_counts.superkingdom_taxid = #{TaxonLineage::MISSING_SUPERKINGDOM_ID}
      WHERE taxon_counts.pipeline_run_id=#{id}
    ")
    TaxonCount.connection.execute("
      UPDATE taxon_counts, taxon_lineages
      SET taxon_counts.genus_taxid = taxon_lineages.genus_taxid,
          taxon_counts.superkingdom_taxid = taxon_lineages.superkingdom_taxid
      WHERE taxon_counts.pipeline_run_id=#{id} AND
            (taxon_counts.created_at BETWEEN taxon_lineages.started_at AND taxon_lineages.ended_at) AND
            taxon_lineages.taxid = taxon_counts.tax_id
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
    (1.0 * subsampled_reads) / remaining_reads
  end

  def count_unmapped_reads
    unidentified_fasta = get_s3_file(sample.unidentified_fasta_s3_path)
    unidentified_fasta.lines.select { |line| line.start_with? '>' }.count if unidentified_fasta
  end
end
