class AddLevelConcordanceToTaxonCounts < ActiveRecord::Migration[5.1]
  def change
    add_column :taxon_counts, :percent_concordant, :float
    add_column :taxon_counts, :species_total_concordant, :float
    add_column :taxon_counts, :genus_total_concordant, :float
    add_column :taxon_counts, :family_total_concordant, :float
  end
end
