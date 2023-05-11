class RemoveUnusedTaxonScoringModel < ActiveRecord::Migration[6.1]
  def up
    drop_table :taxon_scoring_models
  end

  def down
    raise ActiveRecord::IrreversibleMigration
  end
end
