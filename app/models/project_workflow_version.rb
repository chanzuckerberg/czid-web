class ProjectWorkflowVersion < ApplicationRecord
  belongs_to :project

  def self.project_ids_pinned_to_workflow(workflow)
    where(workflow: workflow).distinct.pluck(:project_id)
  end
end
