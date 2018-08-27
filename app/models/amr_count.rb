# Model that has data fields necessary for displaying
# anti microbial resistance (AMR) information for a
# given pipeline run of a sample.
class AmrCount < ApplicationRecord
  belongs_to :pipeline_run
end
