class AddMergedNtNrSpeciesAndGenusColumnsInContigs < ActiveRecord::Migration[5.2]
  def change
    change_table :contigs, bulk: true do |t|
      t.integer :species_taxid_merged_nt_nr, :genus_taxid_merged_nt_nr, null: true
      t.index ["pipeline_run_id", "species_taxid_merged_nt_nr"]
      t.index ["pipeline_run_id", "genus_taxid_merged_nt_nr"]
    end
  end
end
