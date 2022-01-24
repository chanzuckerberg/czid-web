class Annotation < ApplicationRecord
  belongs_to :pipeline_run
  enum content: { hit: 0, not_a_hit: 1, inconclusive: 2 }
end
