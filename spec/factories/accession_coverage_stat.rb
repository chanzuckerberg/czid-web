FactoryBot.define do
  factory :accession_coverage_stat, class: AccessionCoverageStat do
    sequence(:accession_id) { |n| "accession_id_#{n}" }
    sequence(:accession_name) { |n| "accession_name_#{n}" }
    sequence(:taxid) { |n| n }
    num_contigs { 1 }
    num_reads { 1 }
    score { 1000 }
    coverage_breadth { 0.25 }
    coverage_depth { 0.02 }
  end
end
