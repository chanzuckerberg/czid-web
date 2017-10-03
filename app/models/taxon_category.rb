# The TaxonCategory model associates taxids with categories. The possible values for 'category' are:
# 'A' for Archaea
# 'B' for Bacteria
# 'E' for Eukaryota
# 'V' for Viruses and Viroids
# 'U' for Unclassified
# 'O' for Other
class TaxonCategory < ApplicationRecord
  belongs_to :taxon_description
end
