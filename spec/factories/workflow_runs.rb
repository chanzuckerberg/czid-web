FactoryBot.define do
  factory :workflow_run, class: WorkflowRun do
    association :sample
  end
end
