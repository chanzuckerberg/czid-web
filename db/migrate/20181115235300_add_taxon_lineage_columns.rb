class AddTaxonLineageColumns < ActiveRecord::Migration[5.1]
  def up
    add_column :taxon_lineages, :tax_name, :string
    add_index :taxon_lineages, :tax_name
    # Limit = 1 byte for max 255
    add_column :taxon_lineages, :version_start, :integer, limit: 1
    add_column :taxon_lineages, :version_end, :integer, limit: 1
  end

  def down
    remove_index :taxon_lineages, :tax_name
    remove_column :taxon_lineages, :tax_name
    remove_column :taxon_lineages, :version_start
    remove_column :taxon_lineages, :version_end
  end
end
