FactoryBot.define do
  factory :metadata_field, class: MetadataField do
    sequence(:name) { |n| "metadata_field_#{n}" }
    base_type { 0 }
  end
end
