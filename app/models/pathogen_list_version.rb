class PathogenListVersion < ApplicationRecord
  has_and_belongs_to_many :pathogens
  has_and_belongs_to_many :citations
  belongs_to :pathogen_list

  def fetch_citation_footnotes
    citations.pluck(:footnote).uniq
  end

  # Returns a list of pathogens, where each pathogen contains the following info:
  # {
  #   category: category_name,
  #   name: taxon_name,
  #   tax_id: tax_id
  # }
  def fetch_pathogens_info
    taxids = pathogens.pluck(:tax_id)
    taxid_to_category = TaxonLineage.where(taxid: taxids).pluck(:taxid, :superkingdom_name).to_h
    taxid_to_species_name = TaxonLineage.where(taxid: taxids).pluck(:taxid, :species_name).to_h
    info = []
    pathogens.each do |pathogen|
      taxid = pathogen.tax_id
      pathogen_info = {
        category: taxid_to_category[taxid],
        name: taxid_to_species_name[taxid],
        tax_id: taxid,
      }
      info << pathogen_info
    end
    info
  end

  def fetch_pathogen_names
    taxids = pathogens.pluck(:tax_id)
    taxid_to_species_name = TaxonLineage.where(taxid: taxids).pluck(:taxid, :species_name).to_h
    pathogen_names = pathogens.map { |pathogen| taxid_to_species_name[pathogen.tax_id] }
    pathogen_names.to_set
  end
end
