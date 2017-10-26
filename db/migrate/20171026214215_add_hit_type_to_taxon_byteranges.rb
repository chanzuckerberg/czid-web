class AddHitTypeToTaxonByteranges < ActiveRecord::Migration[5.1]
  def change
    add_column :taxon_byteranges, :hit_type, :string
    add_index :taxon_byteranges, [:pipeline_output_id, :hit_type, :taxid], name: 'index_taxon_byteranges_on_details'
    remove_index :taxon_byteranges, name: :index_taxon_byteranges_on_pipeline_output_id_and_taxid
  end
end
