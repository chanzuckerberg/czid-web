class NextgenDeletionLog < ApplicationRecord
  belongs_to :user
  validates :object_type, inclusion: { in: [Sample.name, WorkflowRun.name, "ConsensusGenome", BulkDownload.name] }
end
