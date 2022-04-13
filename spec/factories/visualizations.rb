FactoryBot.define do
  factory :visualization, class: Visualization do
    data { { "test data" => [] } }
    status { "SUCCEEDED" }
  end
end
