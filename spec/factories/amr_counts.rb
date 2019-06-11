FactoryBot.define do
  factory :amr_count, class: AmrCount do
    sequence(:gene) { |n| "GenE_#{n}" }
    sequence(:allele) { |n| "AllE_#{n}" }
    sequence(:coverage) { |n| 75 + (n / 100) }
    sequence(:depth) { |n| 0.5 + (n / 1000) }
    sequence(:pipeline_run_id) { |n| n }
    sequence(:drug_family) { |n| "DruG_#{n}" }
  end
end
