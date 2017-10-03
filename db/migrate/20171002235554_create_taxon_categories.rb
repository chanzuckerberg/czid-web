class CreateTaxonCategories < ActiveRecord::Migration[5.1]
  def change
    create_table :taxon_categories do |t|
      t.integer :taxid
      t.string :category
      t.references :taxon_description, foreign_key: true

      t.timestamps
    end
  end
end
