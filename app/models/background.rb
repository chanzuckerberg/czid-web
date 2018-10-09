class Background < ApplicationRecord
  has_and_belongs_to_many :samples, through: :pipeline_runs
  has_and_belongs_to_many :pipeline_runs
  has_many :taxon_summaries, dependent: :destroy
  belongs_to :project, optional: true
  validate :validate_size
  validates :name, presence: true, uniqueness: true
  after_save :submit_store_summary_job
  attr_accessor :just_updated

  DEFAULT_BACKGROUND_MODEL_NAME = "default".freeze
  TAXON_SUMMARY_CHUNK_SIZE = 100

  def self.eligible_pipeline_runs
    PipelineRun.top_completed_runs.order(:sample_id)
  end

  def validate_size
    errors.add(:base, "Need to select at least 2 pipeline runs.") if pipeline_runs.size < 2
  end

  def summarize
    rows = TaxonCount.connection.select_all("
      SELECT
        tax_id,
        count_type,
        tax_level,
        @adjusted_total_reads := (total_reads - IFNULL(total_ercc_reads, 0)) * IFNULL(fraction_subsampled, 1.0),
        (1.0*1e6*count)/@adjusted_total_reads as rpm,
        (1.0*1e6*count*1e6*count)/(@adjusted_total_reads*@adjusted_total_reads) AS rpm2
      FROM `taxon_counts`
      INNER JOIN `pipeline_runs` ON
        `pipeline_runs`.`id` = `taxon_counts`.`pipeline_run_id`
      WHERE (pipeline_run_id in (select pipeline_run_id from backgrounds_pipeline_runs where background_id = #{id}))
      ORDER BY tax_id, count_type, tax_level
    ").to_a
    n = pipeline_runs.count
    date = DateTime.now.in_time_zone
    key = ""
    taxon_result = {}
    result_list = []
    rows.each do |row|
      current_key = [row["tax_id"], row["count_type"], row["tax_level"]].join('-')
      if current_key != key
        if taxon_result[:tax_id] # empty for first row
          # add the taxon_result to result_list
          result_list << summarize_taxon(taxon_result, n, date)
        end
        # reset the results
        taxon_result = { tax_id: row["tax_id"], count_type: row["count_type"],
                         tax_level: row["tax_level"], sum_rpm: 0.0, sum_rpm2: 0.0, rpm_list: [] }
        key = current_key
      end
      # increment
      taxon_result[:sum_rpm] += row["rpm"]
      taxon_result[:sum_rpm2] += row["rpm2"]
      taxon_result[:rpm_list] << row["rpm"].round(3)
    end
    # addd the last result
    result_list << summarize_taxon(taxon_result, n, date)

    result_list
  end

  def summarize_taxon(taxon_result, n, date)
    taxon_result[:background_id] = id
    taxon_result[:created_at] = date
    taxon_result[:updated_at] = date
    taxon_result[:mean] = (taxon_result[:sum_rpm]) / n.to_f
    taxon_result[:stdev] = compute_stdev(taxon_result[:sum_rpm], taxon_result[:sum_rpm2], n)

    # add zeroes to the rpm_list for no presence to complete the list
    taxon_result[:rpm_list] << 0.0 while taxon_result[:rpm_list].size < n
    taxon_result[:rpm_list] = taxon_result[:rpm_list].to_json

    taxon_result
  end

  def submit_store_summary_job
    Resque.enqueue(ComputeBackground, id) unless just_updated
  end

  def store_summary
    ActiveRecord::Base.transaction do
      ActiveRecord::Base.connection.execute <<-SQL
      DELETE FROM taxon_summaries WHERE background_id = #{id}
      SQL
      data = summarize.map { |h| h.slice(:tax_id, :count_type, :tax_level, :background_id, :created_at, :updated_at, :mean, :stdev, :rpm_list) }
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
    self.just_updated = true # to not trigger another background computation job
    update(ready: 1) # background will be displayed on report page
  end

  def compute_stdev(sum, sum2, n)
    x = (sum2 - sum**2 / n.to_f) / (n - 1)
    # In theory, x can mathematically be proven to be non-negative.
    # But in practice, rounding errors can make it slightly negative when it should be 0.
    x = [0, x].max
    Math.sqrt(x)
  end

  def destroy
    TaxonSummary.where(background_id: id).delete_all
    super
  end

  def self.viewable(user)
    if user.admin?
      all
    else
      # Background is viewable by user if either
      # (A) user is allowed to view all pipeline_runs that went into the background, or
      # (B) background is marked as public (regardless of whether user is allowed to view individual pipeline_runs).
      condition_b = "public_access = 1"
      viewable_pipeline_run_ids = PipelineRun.where(sample_id: Sample.viewable(user).pluck(:id)).pluck(:id)
      condition_a = if viewable_pipeline_run_ids.empty?
                      "false"
                    else
                      "id not in (select background_id from backgrounds_pipeline_runs
                                  where pipeline_run_id not in (#{viewable_pipeline_run_ids.join(',')}))"
                    end
      condition = [condition_b, condition_a].join(" or ")
      where(condition)
    end
  end
end
