class CreateTaxonCounts < ActiveRecord::Migration[5.1]
  def change
    create_table :taxon_counts do |t|
      t.references :pipeline_output, foreign_key: true
      t.integer :tax_id
      t.integer :tax_level
      t.integer :count

      t.timestamps
    end
  end
end
