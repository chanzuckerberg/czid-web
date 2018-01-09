class PipelineOutput < ApplicationRecord
  include PipelineOutputsHelper
  belongs_to :sample
  has_many :taxon_counts
  has_many :job_stats
  has_many :taxon_byteranges
  accepts_nested_attributes_for :taxon_counts
  accepts_nested_attributes_for :job_stats
  accepts_nested_attributes_for :taxon_byteranges
  belongs_to :pipeline_run

  def name
    ['ID#', id, ' (', sample.name, ')'].join('')
  end

end
