class AddQualitiesToTaxonCounts < ActiveRecord::Migration[5.1]
  def change
    add_column :taxon_counts, :percent_identity, :float, limit: 24
    add_column :taxon_counts, :alignment_length, :float, limit: 24
    add_column :taxon_counts, :e_value, :float, limit: 24
  end
end
