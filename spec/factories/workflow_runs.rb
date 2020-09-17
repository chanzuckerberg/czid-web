FactoryBot.define do
  factory :workflow_run, class: WorkflowRun do
    association :sample

    deprecated { false }
    workflow { WorkflowRun::WORKFLOW[:consensus_genome] }
  end
end
