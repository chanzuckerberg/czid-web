FactoryBot.define do
  factory :project_workflow_version, class: ProjectWorkflowVersion do
    association :project
  end
end
