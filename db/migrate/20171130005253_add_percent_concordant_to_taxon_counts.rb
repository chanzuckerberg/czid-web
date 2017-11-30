class AddPercentConcordantToTaxonCounts < ActiveRecord::Migration[5.1]
  def change
    add_column :taxon_counts, :percent_concordant, :float
  end
end
