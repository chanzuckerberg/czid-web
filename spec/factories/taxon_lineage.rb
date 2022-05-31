FactoryBot.define do
  factory :taxon_lineage do
    sequence(:tax_name) { |n| "taxon-#{n}" }
    sequence(:taxid) { |n| n }
    sequence(:version_start) { "2022-01-01" }
    sequence(:version_end) { "2022-01-01" }

    factory :species do
      sequence(:tax_name) { |n| "species-#{n}" }
      species_taxid { taxid }
      species_name { tax_name }
    end
  end
end
