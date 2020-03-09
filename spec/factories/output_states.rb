FactoryBot.define do
  factory :output_state, class: OutputState do
    output { "ercc_counts" }
    state { PipelineRun::STATUS_UNKNOWN }
  end
end
