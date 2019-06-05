FactoryBot.define do
  factory :alignment_config, class: AlignmentConfig do
    sequence(:name) { |n| "alignment-config-#{n}" }
    lineage_version { 1 }
  end
end
