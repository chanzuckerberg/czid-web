class DeletionLog < ApplicationRecord
  belongs_to :user
  validates :object_type, inclusion: { in: [Sample.name, PipelineRun.name, WorkflowRun.name] }
end
