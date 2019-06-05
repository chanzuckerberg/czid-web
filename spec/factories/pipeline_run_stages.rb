FactoryBot.define do
  factory :pipeline_run_stage do
    factory :pipeline_run_stage_1_host_filtering do
      step_number { 1 }
      name { "Host Filtering" }
    end
  end
end
