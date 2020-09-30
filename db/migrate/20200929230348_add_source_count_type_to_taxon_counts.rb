class AddSourceCountTypeToTaxonCounts < ActiveRecord::Migration[5.2]
  def change
    add_column :taxon_counts, :source_count_type, :string, null: true, comment: "The count type which the merged_nt_nr value is derived from"
  end
end
