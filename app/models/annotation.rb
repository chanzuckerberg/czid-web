class Annotation < ApplicationRecord
  belongs_to :pipeline_run
  enum content: { hit: 0, not_a_hit: 1, inconclusive: 2 }

  validates :pipeline_run_id, presence: true
  validates :tax_id, presence: true
  validates :content, inclusion: { in: contents.keys }, allow_nil: true
end
