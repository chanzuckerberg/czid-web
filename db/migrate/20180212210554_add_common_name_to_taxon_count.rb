class AddCommonNameToTaxonCount < ActiveRecord::Migration[5.1]
  def change
    add_column :taxon_counts, :common_name, :string
  end
end
