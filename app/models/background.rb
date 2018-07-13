class Background < ApplicationRecord
  has_and_belongs_to_many :samples, through: :pipeline_runs
  has_and_belongs_to_many :pipeline_runs
  has_many :taxon_summaries, dependent: :destroy
  belongs_to :project, optional: true
  validate :validate_size
  after_save :store_summary

  DEFAULT_BACKGROUND_MODEL_NAME = "default".freeze
  TAXON_SUMMARY_CHUNK_SIZE = 100

  def self.eligible_pipeline_runs
    PipelineRun.top_completed_runs.order(:sample_id)
  end

  def validate_size
    errors.add(:base, "Need to select at least 2 pipeline runs.") if pipeline_runs.size < 2
  end

  def summarize
    results = TaxonCount.connection.select_all("
      SELECT
        tax_id,
        count_type,
        tax_level,
        @adjusted_total_reads := (total_reads - IFNULL(total_ercc_reads, 0)) * IFNULL(fraction_subsampled, 1.0),
        sum((1.0*1e6*count)/@adjusted_total_reads) AS sum_rpm,
        sum((1.0*1e6*count*1e6*count)/(@adjusted_total_reads*@adjusted_total_reads)) AS sum_rpm2
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
      h[:mean] = (h["sum_rpm"] || 0.0) / n.to_f
      h[:stdev] = compute_stdev(h["sum_rpm"] || 0.0, h["sum_rpm2"] || 0.0, n)
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
    x = (sum2 - sum**2 / n.to_f) / (n - 1)
    # In theory, x can mathematically be proven to be non-negative.
    # But in practice, rounding errors can make it slightly negative when it should be 0.
    x = [0, x].max
    Math.sqrt(x)
  end

  def self.viewable(user)
    viewable_pipeline_run_ids = PipelineRun.where(sample_id: Sample.viewable(user).pluck(:id)).pluck(:id)
    if user.admin?
      all
    else
      # backgrounds which are marked as public or for which none of the pipeline_run_ids are ABSENT from the viewable_pipeline_run_ids
      where("public_access = 1
             or
             id not in (select background_id from backgrounds_pipeline_runs
                        where pipeline_run_id not in (#{viewable_pipeline_run_ids.join(',')}))")
    end
  end
end
