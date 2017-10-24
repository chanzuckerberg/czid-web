# The TaxonLineage model gives the taxids forming the taxonomic lineage of any given species-level taxid.
class TaxonLineage < ApplicationRecord
  def self.get_genus_info(genus_tax_id)
    r = self.find_by(genus_taxid: genus_tax_id)
    return { query: r.genus_name, tax_id: genus_tax_id } if r
  end
end
