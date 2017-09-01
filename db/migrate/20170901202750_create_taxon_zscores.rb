class CreateTaxonZscores < ActiveRecord::Migration[5.1]
  def change
    create_table :taxon_zscores do |t|
      t.references :report, foreign_key: true
      t.integer :tax_id
      t.integer :tax_level
      t.integer :nt_zscore

      t.timestamps
    end
  end
end
