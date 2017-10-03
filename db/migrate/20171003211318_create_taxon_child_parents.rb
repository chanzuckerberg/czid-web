class CreateTaxonChildParents < ActiveRecord::Migration[5.1]
  def change
    create_table :taxon_child_parents do |t|
      t.integer :taxid
      t.integer :parent_taxid
      t.string :rank

      t.timestamps
    end
  end
end
