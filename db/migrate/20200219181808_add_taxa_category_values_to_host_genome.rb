# This adds more values to taxa_category. Initial values were from:
# https://czi.quip.com/yPgpAPj1dtEC/Hosts-Dropdown-Options
# See also AddTaxaCategoryToHostGenome.
class AddTaxaCategoryValuesToHostGenome < ActiveRecord::Migration[5.1]
  def change
    unknowns = ['Unknown', 'ERCC only']
    HostGenome.where(name: unknowns).find_each { |u| u.update(taxa_category: "unknown") }
    # Any hosts created by users
    HostGenome.where.not(user: nil).where(taxa_category: nil).find_each { |u| u.update(taxa_category: "unknown") }

    # By previous migration, these are all non-human
    HostGenome.where(user: nil, taxa_category: nil).find_each { |u| u.update(taxa_category: "non-human-animal") }
  end
end
