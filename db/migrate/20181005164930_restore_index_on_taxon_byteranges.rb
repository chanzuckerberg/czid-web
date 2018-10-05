class RestoreIndexOnTaxonByteranges < ActiveRecord::Migration[5.1]
  def change
    add_index :taxon_byteranges, :taxid
  end
end
