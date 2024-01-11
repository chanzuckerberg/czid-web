class ProjectWorkflowVersion < ApplicationRecord
  belongs_to :project
  validates :project_id, uniqueness: { scope: [:workflow] }

  def self.project_ids_pinned_to_workflow(workflow)
    where(workflow: workflow).distinct.pluck(:project_id)
  end
end
