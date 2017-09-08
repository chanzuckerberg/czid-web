class AddTaxonomyToTaxonDescription < ActiveRecord::Migration[5.1]
  def change
    add_reference :taxon_descriptions, :taxonomy, foreign_key: true
  end
end
