FactoryBot.define do
  factory :taxon_lineage do
    sequence(:tax_name) { |n| "taxon-#{n}" }
    sequence(:taxid) { |n| n }
    sequence(:started_at) { |n| Time.zone.local(2000 - n, 1, 1) }
    sequence(:ended_at) { |n| Time.zone.local(3000 + n, 1, 1) }
    sequence(:version_start) { 1 }
    sequence(:version_end) { 1 }
    sequence(:version_start_new) { "2022-01-01" }
    sequence(:version_end_new) { "2022-01-01" }

    factory :species do
      sequence(:tax_name) { |n| "species-#{n}" }
      species_taxid { taxid }
      species_name { tax_name }
    end
  end
end
