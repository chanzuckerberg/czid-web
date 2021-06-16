FactoryBot.define do
  factory :phylo_tree_ng, class: PhyloTreeNg do
    sequence(:name) { |n| "Phylo Tree NG #{n}" }
    user { create(:user) }
    project { create(:project) }

    deprecated { false }
  end
end
