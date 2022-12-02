FactoryBot.define do
  factory :contig, class: Contig do
    sequence(:sequence) { "GATTACA" }
    lineage_json { "{}" }
    read_count { 1 }
    base_count { 1_000 }
  end
end
