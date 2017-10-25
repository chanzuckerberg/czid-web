class ChangeTaxonSequenceLocation < ActiveRecord::Migration[5.1]
  def change
    add_column :taxon_sequence_locations, :first_byte, :bigint
    add_column :taxon_sequence_locations, :last_byte, :bigint
    remove_column :taxon_sequence_locations, :first_row
    remove_column :taxon_sequence_locations, :last_row
  end
end
