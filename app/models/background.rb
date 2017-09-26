class Background < ApplicationRecord
  has_and_belongs_to_many :samples
  has_and_belongs_to_many :pipeline_outputs
  has_many :reports, dependent: :destroy
  validate :validate_size

  def validate_size
    errors.add(:base, "Need to select at least 2 pipeline runs.") if pipeline_outputs.size < 2
  end

  def summarize
    entries = []
    pipeline_outputs.each do |p|
      p.taxon_counts.each do |taxon_count|
        entries << { taxid: taxon_count.tax_id, count_type: taxon_count.count_type }
      end
    end
    entries = entries.uniq
    summary = []
    entries.each do |entry|
      sum = 0
      sum_sq = 0
      n = 0
      pipeline_outputs.each do |p|
        taxon_count = p.taxon_counts.find_by(tax_id: entry[:tax_id], count_type: entry[:count_type])
        if taxon_count
          count = taxon_count.count
          normalized_count = count.to_f / p.total_reads
        else
          normalized_count = 0
        end
        sum += normalized_count
        sum_sq += normalized_count**2
        n += 1
      end
      mean = sum.to_f / n
      stdev = Math.sqrt((sum_sq.to_f - sum**2 / n) / (n - 1))
      summary << { taxid: entry[:tax_id], count_type: entry[:count_type], mean: mean, stdev: stdev }
    end
    summary
  end
end
