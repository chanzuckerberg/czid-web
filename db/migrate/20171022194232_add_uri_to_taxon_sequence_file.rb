class AddUriToTaxonSequenceFile < ActiveRecord::Migration[5.1]
  def change
    add_column :taxon_sequence_files, :uri, :string
  end
end
