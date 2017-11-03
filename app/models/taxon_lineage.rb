# The TaxonLineage model gives the taxids forming the taxonomic lineage of any given species-level taxid.
class TaxonLineage < ApplicationRecord
  MISSING_SPECIES_ID = -100
  MISSING_SPECIES_ID_ALT = -1
  MISSING_GENUS_ID = -200
  BLACKLIST_GENUS_ID = -201
  MISSING_FAMILY_ID = -300
  MISSING_ORDER_ID = -400
  MISSING_CLASS_ID = -500
  MISSING_PHYLLUM_ID = -600
  MISSING_SUPERKINGDOM_ID = -700
  MISSING_LINEAGE_ID = {
    species: MISSING_SPECIES_ID,
    genus: MISSING_GENUS_ID,
    family: MISSING_FAMILY_ID,
    order: MISSING_ORDER_ID,
    class: MISSING_CLASS_ID,
    phyllum: MISSING_PHYLLUM_ID,
    superkingdom: MISSING_SUPERKINGDOM_ID
  }.freeze
  def self.get_genus_info(genus_tax_id)
    r = find_by(genus_taxid: genus_tax_id)
    return { query: r.genus_name, tax_id: genus_tax_id } if r
  end
end
