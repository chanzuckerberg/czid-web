# This model gives, for each taxon, summary statistics (mean count, standard deviation) of the background model.
class TaxonSummary < ApplicationRecord
  belongs_to :background
end
