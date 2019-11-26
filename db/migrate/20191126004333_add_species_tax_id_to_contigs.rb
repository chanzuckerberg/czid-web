class AddSpeciesTaxIdToContigs < ActiveRecord::Migration[5.1]
  def change
    # Do NOT add a default value.
    # Adding a default value can cause the migration to take a long time, because each row must be modified.
    add_column :contigs, :species_taxid_nt, :integer
    add_column :contigs, :species_taxid_nr, :integer
    add_column :contigs, :genus_taxid_nt, :integer
    add_column :contigs, :genus_taxid_nr, :integer
  end
end
