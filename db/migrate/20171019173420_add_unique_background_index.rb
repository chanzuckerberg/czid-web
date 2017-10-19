class AddUniqueBackgroundIndex < ActiveRecord::Migration[5.1]
  def change
    add_index :taxon_summaries, [:background_id, :count_type, :tax_level, :tax_id], unique: true, name: "index_taxon_summaries_detailed"
  end
end
