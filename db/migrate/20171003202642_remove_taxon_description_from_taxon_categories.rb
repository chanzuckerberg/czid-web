class RemoveTaxonDescriptionFromTaxonCategories < ActiveRecord::Migration[5.1]
  def change
    remove_reference :taxon_categories, :taxon_description, foreign_key: true
  end
end
