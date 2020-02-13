FactoryBot.define do
  factory :contig, class: Contig do
    sequence { "AGCT" }
    lineage_json { "{}" }
    read_count { 1 }
  end
end
