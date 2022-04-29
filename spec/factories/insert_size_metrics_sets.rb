FactoryBot.define do
  factory :insert_size_metric_set, class: InsertSizeMetricSet do
    median { 0 }
    mode { 0 }
    median_absolute_deviation { 0 }
    min { 0 }
    max { 0 }
    mean { 0 }
    standard_deviation { 0 }
    read_pairs { 0 }
  end
end
