class AddErccToTaxonSummaries < ActiveRecord::Migration[5.2]
  def change
    add_column :taxon_summaries, :mean_mass_normalized, :float
    add_column :taxon_summaries, :stdev_mass_normalized, :float
    add_column :taxon_summaries, :rel_abundance_list_mass_normalized, :text

    add_column :backgrounds, :mass_normalized, :boolean, null: false, default: false
  end
end
