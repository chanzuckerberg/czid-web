class PipelineOutput < ApplicationRecord
  belongs_to :sample
  has_many :taxon_counts, dependent: :destroy
  has_many :reports, dependent: :destroy
  has_and_belongs_to_many :backgrounds
  accepts_nested_attributes_for :taxon_counts
  def name
    ['ID#', id, ' (', sample.name, ')'].join('')
  end
end
