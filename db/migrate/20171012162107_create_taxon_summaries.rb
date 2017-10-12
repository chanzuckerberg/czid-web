class CreateTaxonSummaries < ActiveRecord::Migration[5.1]
  def change
    create_table :taxon_summaries do |t|
      t.integer :tax_id
      t.integer :tax_level
      t.string :count_type
      t.string :name
      t.float :mean
      t.float :stdev
      t.references :background, foreign_key: true

      t.timestamps
    end
  end
end
