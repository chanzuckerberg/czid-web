class Annotation < ApplicationRecord
  belongs_to :pipeline_run
  enum content: { hit: 0, not_a_hit: 1, inconclusive: 2 }

  validates :pipeline_run_id, presence: true
  validates :tax_id, presence: true
  validates :content, inclusion: { in: contents.keys }, allow_nil: true

  def self.fetch_annotations_by_tax_id(tax_ids, pipeline_run_id)
    # If a taxon has multiple annotations, only the most recently-created annotation is considered active;
    # the taxon's remaining annotations are considered historical.
    Annotation.where(pipeline_run_id: pipeline_run_id, tax_id: tax_ids).order(id: :desc).group_by(&:tax_id).transform_values { |annotations| annotations.first.content }
  end
end
