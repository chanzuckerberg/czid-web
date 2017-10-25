class CreateTaxonSequenceLocations < ActiveRecord::Migration[5.1]
  def change
    create_table :taxon_sequence_locations do |t|
      t.integer :taxid
      t.integer :first_row
      t.integer :last_row
      t.references :sequence_locator, foreign_key: true

      t.timestamps
    end
  end
end
