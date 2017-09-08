class AddGenusNameToTaxonDescription < ActiveRecord::Migration[5.1]
  def change
    add_column :taxon_descriptions, :genus_name, :string
  end
end
