class AddErccToTaxonSummaries < ActiveRecord::Migration[5.2]
  def change
    change_table :taxon_summaries, bulk: true do |t|
      t.float :mean_mass_normalized
      t.float :stdev_mass_normalized
      t.text :rel_abundance_list_mass_normalized
    end
    add_column :backgrounds, :mass_normalized, :boolean, null: false, default: false
  end
end
