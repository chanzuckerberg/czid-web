FactoryBot.define do
  factory :taxon_lineage do
    sequence(:tax_name) { |n| "taxon-#{n}" }
    sequence(:taxid) { |n| n }

    factory :species do
      sequence(:tax_name) { |n| "species-#{n}" }
      species_taxid { taxid }
      species_name { tax_name }
      version_start { 1 }
      version_end { 1 }
    end
  end
end
