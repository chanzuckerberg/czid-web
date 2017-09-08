class CreateTaxonDescriptions < ActiveRecord::Migration[5.1]
  def change
    create_table :taxon_descriptions do |t|
      t.bigint :tax_id
      t.bigint :species_tax_id
      t.bigint :genus_tax_id
      t.string :species_name

      t.timestamps
    end
  end
end
