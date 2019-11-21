FactoryBot.define do
  factory :taxon_summary do
    sequence(:tax_id) { |n| n }
    count_type { "NT" }
    tax_level { 1 }
  end
end
