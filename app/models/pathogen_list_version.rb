class PathogenListVersion < ApplicationRecord
  has_and_belongs_to_many :pathogens
  belongs_to :pathogen_list

  def fetch_citation_footnotes
    citation_ids = pathogens.pluck(:citation_id)
    Citation.find(citation_ids).pluck(:footnote).uniq
  end

  # Returns a list of pathogens, where each pathogen contains the following info:
  # {
  #   category: category_name,
  #   name: taxon_name,
  #   tax_id: tax_id
  # }
  def fetch_pathogens_info
    taxids = pathogens.pluck(:tax_id)
    taxid_to_category = TaxonLineage.fetch_category_by_taxid(taxids)
    info = []
    pathogens.each do |pathogen|
      taxid = pathogen.tax_id
      pathogen_info = {
        category: taxid_to_category[taxid],
        name: TaxonLineage.where(taxid: taxid).last.species_name,
        tax_id: taxid,
      }
      info << pathogen_info
    end
    info
  end
end
