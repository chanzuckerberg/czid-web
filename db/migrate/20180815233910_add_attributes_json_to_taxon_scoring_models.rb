class AddAttributesJsonToTaxonScoringModels < ActiveRecord::Migration[5.1]
  def change
    add_column :taxon_scoring_models, :attributes_json, :text
    TaxonScoringModel.all.each do |t|
      t.update(attributes_json: '{ "zscore_min": -99, "zscore_max": 99, "zscore_when_absent_from_sample": -100, "zscore_when_absent_from_bg": 100 }')
    end
  end
end
