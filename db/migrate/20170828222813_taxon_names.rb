class TaxonNames < ActiveRecord::Migration[5.1]
  def change
    add_column :taxon_counts, :name, :string
  end
end
