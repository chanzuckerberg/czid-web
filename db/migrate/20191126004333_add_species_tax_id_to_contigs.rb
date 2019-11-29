class AddSpeciesTaxIdToContigs < ActiveRecord::Migration[5.1]
  def change
    # Do NOT add a default value.
    # Adding a default value can cause the migration to take a long time, because each row must be modified.
    change_table :contigs, bulk: true do |t|
      t.integer :species_taxid_nt, :species_taxid_nr, :genus_taxid_nt, :genus_taxid_nr
      t.index ["pipeline_run_id", "species_taxid_nt"]
      t.index ["pipeline_run_id", "species_taxid_nr"]
      t.index ["pipeline_run_id", "genus_taxid_nt"]
      t.index ["pipeline_run_id", "genus_taxid_nr"]
    end
  end
end
