class RemoveTaxonDescriptionFromTaxonChildParents < ActiveRecord::Migration[5.1]
  def change
    remove_reference :taxon_child_parents, :taxon_description, foreign_key: true
  end
end
