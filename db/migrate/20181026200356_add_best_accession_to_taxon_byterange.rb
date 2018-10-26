class AddBestAccessionToTaxonByterange < ActiveRecord::Migration[5.1]
  def change
    add_column :taxon_byteranges, :best_accession, :string
  end
end
