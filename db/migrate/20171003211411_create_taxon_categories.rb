class CreateTaxonCategories < ActiveRecord::Migration[5.1]
  def change
    create_table :taxon_categories do |t|
      t.integer :taxid
      t.string :category

      t.timestamps
    end
  end
end
