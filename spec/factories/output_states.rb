FactoryBot.define do
  factory :output_state, class: OutputState do
    output { nil }
    state { PipelineRun::STATUS_UNKNOWN }
  end
end
