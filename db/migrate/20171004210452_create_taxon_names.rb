class CreateTaxonNames < ActiveRecord::Migration[5.1]
  def change
    create_table :taxon_names do |t|
      t.integer :taxid
      t.string :name

      t.timestamps
    end
  end
end
