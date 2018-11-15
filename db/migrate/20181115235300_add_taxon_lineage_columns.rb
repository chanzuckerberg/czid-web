class AddTaxonLineageColumns < ActiveRecord::Migration[5.1]
  def change
    add_column :taxon_lineages, :name, :string
    # Limit = 1 byte for max 255
    add_column :taxon_lineages, :version_start, :integer, limit: 1
    add_column :taxon_lineages, :version_end, :integer, limit: 1
  end
end
