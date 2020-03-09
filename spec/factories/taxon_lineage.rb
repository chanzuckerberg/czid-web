FactoryBot.define do
  factory :taxon_lineage do
    sequence(:tax_name) { |n| "taxon-#{n}" }
    sequence(:taxid) { |n| n }
    sequence(:started_at) { |n| Time.zone.local(2000 - n, 1, 1) }
    sequence(:ended_at) { |n| Time.zone.local(3000 + n, 1, 1) }
    sequence(:version_start) { |n| n }
    sequence(:version_end) { |n| n + 1 }

    factory :species do
      sequence(:tax_name) { |n| "species-#{n}" }
      species_taxid { taxid }
      species_name { tax_name }
      version_start { 1 }
      version_end { 1 }
    end
  end
end
