class AddCountTypeToTaxonCount < ActiveRecord::Migration[5.1]
  def change
    add_column :taxon_counts, :count_type, :string
    add_index :taxon_counts, [:pipeline_output_id, :tax_id, :count_type], unique: true, name: 'new_index_taxon_counts'
  end
end
