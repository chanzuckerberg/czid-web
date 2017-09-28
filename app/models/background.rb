class Background < ApplicationRecord
  has_and_belongs_to_many :samples
  has_and_belongs_to_many :pipeline_outputs
  has_many :reports, dependent: :destroy
  validate :validate_size

  DEFAULT_BACKGROUND_MODEL_NAME = "default".freeze

  def validate_size
    errors.add(:base, "Need to select at least 2 pipeline runs.") if pipeline_outputs.size < 2
  end

  def summarize 
    results = TaxonCount.joins(:pipeline_output).select("tax_id, count_type, tax_level, name, sum((1.0*1e6*count)/total_reads) as sum_rpm, sum((1.0*1e6*count*1e6*count)/(total_reads*total_reads)) as sum_rpm2").group("tax_id, count_type, tax_level, name").where("pipeline_output_id in (select pipeline_output_id from backgrounds_pipeline_outputs where background_id = #{id})")
    n = pipeline_outputs.count
    results.map { |h| h.attributes.merge(mean: h[:sum_rpm] / n.to_f, stdev: compute_stdev(h[:sum_rpm], h[:sum_rpm2], n)) }
  end

  def compute_stdev(sum, sum2, n)
    Math.sqrt((sum2 - sum**2 / n.to_f) / (n - 1))
  end
end
