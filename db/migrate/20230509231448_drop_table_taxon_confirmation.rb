class DropTableTaxonConfirmation < ActiveRecord::Migration[6.1]
  def up
    drop_table :taxon_confirmations
  end

  def down
    raise ActiveRecord::IrreversibleMigration
  end
end
