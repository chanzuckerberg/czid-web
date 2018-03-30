class Background < ApplicationRecord
  has_and_belongs_to_many :samples, through: :pipeline_runs
  has_and_belongs_to_many :pipeline_runs
  has_many :taxon_summaries, dependent: :destroy
  validate :validate_size
  after_save :store_summary

  DEFAULT_BACKGROUND_MODEL_NAME = "default".freeze
  TAXON_SUMMARY_CHUNK_SIZE = 100

  def self.eligible_pipeline_runs
    PipelineRun.where("id in (select max(id) from pipeline_runs where job_status = 'CHECKED' and sample_id in (select id from samples) group by sample_id)").order(:sample_id)
  end

  def validate_size
    errors.add(:base, "Need to select at least 2 pipeline runs.") if pipeline_runs.size < 2
  end

  def summarize
    adjusted_total_reads_formula = "(total_reads - IFNULL(total_ercc_reads, 0)) * fraction_subsampled"
    results = TaxonCount.connection.select_all("
      SELECT
        tax_id,
        count_type,
        tax_level,
        sum((1.0*1e6*count)/(#{adjusted_total_reads_formula}) AS sum_rpm,
        sum((1.0*1e6*count*1e6*count)/((#{adjusted_total_reads_formula})*(#{adjusted_total_reads_formula}))) AS sum_rpm2
      FROM `taxon_counts`
      INNER JOIN `pipeline_runs` ON
        `pipeline_runs`.`id` = `taxon_counts`.`pipeline_run_id`
      WHERE (pipeline_run_id in (select pipeline_run_id from backgrounds_pipeline_runs where background_id = #{id}))
      GROUP BY tax_id, count_type, tax_level
    ").to_hash
    n = pipeline_runs.count
    date = DateTime.now.in_time_zone
    results.each do |h|
      h[:background_id] = id
      h[:created_at] = date
      h[:updated_at] = date
      h[:mean] = h["sum_rpm"] / n.to_f
      h[:stdev] = compute_stdev(h["sum_rpm"], h["sum_rpm2"], n)
    end
    results
  end

  def store_summary
    ActiveRecord::Base.transaction do
      ActiveRecord::Base.connection.execute <<-SQL
      DELETE FROM taxon_summaries WHERE background_id = #{id}
      SQL
      data = summarize.map { |h| h.slice('tax_id', 'count_type', 'tax_level', :background_id, :created_at, :updated_at, :mean, :stdev) }
      data_chunks = data.in_groups_of(TAXON_SUMMARY_CHUNK_SIZE, false)
      data_chunks.each do |chunk|
        columns = chunk.first.keys
        values_list = chunk.map do |hash|
          hash.values.map do |value|
            ActiveRecord::Base.connection.quote(value)
          end
        end
        ActiveRecord::Base.connection.execute <<-SQL
        INSERT INTO taxon_summaries (#{columns.join(',')}) VALUES #{values_list.map { |values| "(#{values.join(',')})" }.join(', ')}
        SQL
      end
    end
  end

  def compute_stdev(sum, sum2, n)
    Math.sqrt((sum2 - sum**2 / n.to_f) / (n - 1))
  end
end
