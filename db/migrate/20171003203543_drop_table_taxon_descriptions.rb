class DropTableTaxonDescriptions < ActiveRecord::Migration[5.1]
  def change
    drop_table :taxon_descriptions
  end
end
