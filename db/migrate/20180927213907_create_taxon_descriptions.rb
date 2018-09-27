class CreateTaxonDescriptions < ActiveRecord::Migration[5.1]
  def change
    create_table :taxon_descriptions do |t|
      t.integer :taxid, null: false, unique: true
      t.bigint :wikipedia_id
      t.text :description
      t.timestamps
    end
  end
end
