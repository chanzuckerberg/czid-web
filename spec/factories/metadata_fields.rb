FactoryBot.define do
  factory :metadata_field, class: MetadataField do
    sequence(:name) { |n| "metadata_field_#{n}" }
    sequence(:display_name) { |n| "Metadata field #{n}" }
    base_type { 0 }
  end
end
