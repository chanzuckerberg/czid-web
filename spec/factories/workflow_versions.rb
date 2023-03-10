FactoryBot.define do
  factory :workflow_version, class: WorkflowVersion do
    deprecated { false }
    runnable { true }
  end
end
