class Background < ApplicationRecord
  has_and_belongs_to_many :samples, through: :pipeline_runs
  has_and_belongs_to_many :pipeline_runs
  has_many :taxon_summaries, dependent: :destroy
  belongs_to :project, optional: true
  validate :validate_size
  before_save :set_version
  after_create :store_summary

  default_scope { order(id: :desc) }

  DEFAULT_BACKGROUND_MODEL_NAME = "default".freeze
  TAXON_SUMMARY_CHUNK_SIZE = 100

  def current?
    id == Background.find_by(name: name).id
  end

  def self.current_backgrounds
    # backgrounds that are of the latest version of the same name
    where("id in (
        select id from backgrounds inner join (
          select name, max(created_at) as c from backgrounds group by name
        ) as bg2 on backgrounds.name = bg2.name and backgrounds.created_at = bg2.c
    )")
  end

  def self.eligible_pipeline_runs
    PipelineRun.top_completed_runs.order(:sample_id)
  end

  def validate_size
    errors.add(:base, "Need to select at least 2 pipeline runs.") if pipeline_runs.size < 2
  end

  def new_params(params)
    # Deciding what to do when user intends to update a background model
    background = self
    name_changed = params[:name] && name != params[:name]
    pipeline_runs_changed = params[:pipeline_run_ids] && params[:pipeline_run_ids].map(&:to_i).select { |p| p > 0 }.sort != pipeline_runs.pluck(:id).sort
    if pipeline_runs_changed
      # create a new bacgkround model when list of pipeline_runs changed
      background = Background.new(params)
      background.project_id = project_id
    elsif name_changed # but pipeline runs not changed
      # update the names who have the same name
      Background.where(name: name).find_each { |bg| bg.update(name: params[:name]) }
      background.name = params[:name]
    end
    background
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

  def pipeline_run_ids
    # get the list of successful and most recent pipeline_runs that belong to the same samples
    updated_pipeline_run_ids = []
    pipeline_runs.each do |pr|
      pr_new = pr.sample.pipeline_runs.find_by(job_status: PipelineRun::STATUS_CHECKED)
      updated_pipeline_run_ids << pr_new.id if pr_new
    end
    updated_pipeline_run_ids
  end

  def set_version
    self.pipeline_version = pipeline_runs.map { |pr| pr.pipeline_version.to_f }.max.to_s
  end

  def store_summary
    ActiveRecord::Base.transaction do
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

  def self.viewable(user)
    if user.admin?
      all
    else
      where(project_id: Project.viewable(user).pluck(:id) + [nil])
    end
  end
end
