class AddIndexToTaxonByteRanges < ActiveRecord::Migration[5.1]
  def change
    add_index :taxon_byteranges, [:pipeline_output_id, :taxid]
  end
end
