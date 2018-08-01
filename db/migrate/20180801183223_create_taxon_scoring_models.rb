class CreateTaxonScoringModels < ActiveRecord::Migration[5.1]
  def change
    create_table :taxon_scoring_models do |t|
      t.string :name
      t.text   :model_json
      t.timestamps
      t.index [:name], unique: true
    end
  end
end
