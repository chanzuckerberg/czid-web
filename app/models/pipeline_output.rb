class PipelineOutput < ApplicationRecord
  belongs_to :sample
  has_many :taxon_counts, dependent: :destroy
  has_many :reports, dependent: :destroy
  has_many :job_stats, dependent: :destroy
  has_and_belongs_to_many :backgrounds
  has_many :postprocess_runs, dependent: :destroy
  has_one :sequence_locator
  accepts_nested_attributes_for :taxon_counts
  accepts_nested_attributes_for :job_stats
  belongs_to :pipeline_run

  STATUS_POSTPROCESS = 'need_postprocess'.freeze
  STATUS_CHECKED_POSTPROCESS = 'checked_postprocess'.freeze
  DEFAULT_POSTPROCESS_MEMORY = 8_000
  DEFAULT_POSTPROCESS_QUEUE = 'aegea_batch_ondemand'.freeze

  before_save :check_postprocess_status

  def name
    ['ID#', id, ' (', sample.name, ')'].join('')
  end

  def generate_report
    if sample.host_genome && sample.host_genome.default_background
      Report.create(name: "#{sample.id}: #{sample.name}",
                    pipeline_output: self,
                    background: sample.host_genome.default_background)

    end
  end

  def generate_aggregate_counts(tax_level_name)
    current_date = Time.zone.now.strftime("%Y-%m-%d")
    tax_level_id = TaxonCount::NAME_2_LEVEL[tax_level_name]
    # TODO(yf): take into account the case when tax_id doesn't appear in the taxon_lineages table
    TaxonCount.connection.execute(
      "INSERT INTO taxon_counts(pipeline_output_id, tax_id, name,
                                tax_level, count_type, count,
                                percent_identity, alignment_length, e_value,
                                created_at, updated_at)
       SELECT #{id}, taxon_lineages.#{tax_level_name}_taxid, taxon_lineages.#{tax_level_name}_name,
              #{tax_level_id}, taxon_counts.count_type,
              sum(taxon_counts.count),
              sum(taxon_counts.percent_identity * taxon_counts.count) / sum(taxon_counts.count),
              sum(taxon_counts.alignment_length * taxon_counts.count) / sum(taxon_counts.count),
              sum(taxon_counts.e_value * taxon_counts.count) / sum(taxon_counts.count),
              '#{current_date}', '#{current_date}'
       FROM  taxon_lineages, taxon_counts
       WHERE taxon_lineages.taxid = taxon_counts.tax_id AND
             taxon_counts.pipeline_output_id = #{id} AND
             taxon_counts.tax_level = #{TaxonCount::TAX_LEVEL_SPECIES}
      GROUP BY 1,2,3,4,5"
    )
  end

  def check_postprocess_status
    return unless status == STATUS_POSTPROCESS
    self.status = STATUS_CHECKED_POSTPROCESS
    kickoff_postprocess_pipeline(false)
  end

  def postprocess_command
    script_name = File.basename(IdSeqPostprocess::S3_SCRIPT_LOC)
    batch_command_env_variables = "RESULTS_BUCKET=#{sample_input_s3_path} DB_SAMPLE_ID=#{id} "
    batch_command = "aws s3 cp #{IdSeqPostprocese::S3_SCRIPT_LOC} .; chmod 755 #{script_name}; " +
                    batch_command_env_variables + "./#{script_name}"
    command = "aegea batch submit --command=\"#{batch_command}\" "
    memory = DEFAULT_POSTPROCESS_MEMORY
    queue = DEFAULT_POSTPROCESS_QUEUE
    command += " --storage /mnt=1500 --ecr-image idseq --memory #{memory} --queue #{queue} --vcpus 16"
    command
  end

  def kickoff_postprocess_pipeline(dry_run = true)
    # only kickoff pipeline when no active postprocess_run running
    return unless postprocess_runs.in_progress.empty?

    command = postprocess_command
    if dry_run
      Rails.logger.debug(command)
      return command
    end

    stdout, stderr, status = Open3.capture3(command)
    pr = PostprocessRun.new
    pr.sample = self
    pr.command = command
    pr.command_stdout = stdout
    pr.command_error = stderr
    pr.command_status = status.to_s
    if status.exitstatus.zero?
      output = JSON.parse(pr.command_stdout)
      pr.job_id = output['jobId']
    else
      pr.job_status = PostprocessRun::STATUS_FAILED
    end
    pr.save
  end
end
end
