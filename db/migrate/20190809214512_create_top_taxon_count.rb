class CreateTopTaxonCount < ActiveRecord::Migration[5.1]
  def change
    create_table :top_taxon_counts do |t|
      # START OF COLUMNS COPIED FROM taxon_counts
      t.references :pipeline_run, foreign_key: true
      t.integer :tax_id
      t.integer :tax_level
      t.integer :count
      t.string "name"
      t.string "count_type"
      t.float "percent_identity", limit: 24
      t.float "alignment_length", limit: 24
      t.float "e_value", limit: 24
      t.integer "genus_taxid", default: -200, null: false
      t.integer "superkingdom_taxid", default: -700, null: false
      t.string "common_name"
      t.integer "family_taxid", default: -300, null: false
      t.integer "is_phage", limit: 1, default: 0, null: false
      t.float "e_value", limit: 24, null: false
      # END OF COLUMNS COPIED FROM taxon_counts

      # START OF COLUMNS COMPUTED
      t.float "rpm", limit: 24, null: false
      t.integer "rpm_rank", null: false
      # END OF COLUMNS COMPUTED

      t.timestamps
    end
  end
end
