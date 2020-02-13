FactoryBot.define do
  factory :phylo_tree do
    sequence(:name) { |n| "Project #{n}" }
    user { create(:user) }
    project { create(:project) }
    taxid { 1 }
    tax_name { "tax_name" }
    tax_level { TaxonCount::TAX_LEVEL_SPECIES }
    # NOTE: this conflicts with phylo_trees_controller_spec.rb
    # association :taxid, factory: [:taxon_lineage]
  end
end
