class CreateTaxonSummaries < ActiveRecord::Migration[5.1]
  def change
    create_table :taxon_summaries do |t|
      t.references :background, foreign_key: true
      t.integer :tax_id
      t.string :count_type
      t.integer :tax_level
      t.string :name
      t.float :mean
      t.float :stdev

      t.timestamps
    end
  end
end
