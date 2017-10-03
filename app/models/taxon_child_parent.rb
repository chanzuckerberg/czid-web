# The TaxonChildParent model associates each taxid with its parent taxid and rank (spcies, genus, etc.).
# To find the genus associated with a species, look up the species by its taxid and retrieve its parent_taxid.
class TaxonChildParent < ApplicationRecord
end
