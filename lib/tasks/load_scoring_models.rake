# load scoring models
# Run with rake map_patho_list['patho_list.txt']

task :load_scoring_models, [:models_json] => :environment do |_t, args|
  models = JSON.parse(File.read(args[:models_json]))

  models.each do |model|
    next unless model["name"] && model["model"]
    scoring_model = TaxonScoringModel.find_by(name: model["name"]) || TaxonScoringModel.new(name: model["name"])
    scoring_model.model = model["model"]
    scoring_model.model_type = model["model_type"]
    scoring_model.save
  end
end
