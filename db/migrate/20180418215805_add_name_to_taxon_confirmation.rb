class AddNameToTaxonConfirmation < ActiveRecord::Migration[5.1]
  def change
    add_column :taxon_confirmations, :name, :string
  end
end
