class VersionPinningService
  include Callable

  def initialize(project_id, workflow, version_to_pin)
    @project_id = project_id
    @workflow = workflow
    @version_to_pin = version_to_pin
  end

  def call
    existing_version_prefix = ProjectWorkflowVersion.find_by(project_id: @project_id, workflow: @workflow)&.version_prefix
    if existing_version_prefix.nil?
      pin_project_to_workflow_version
    end
  end

  private

  def pin_project_to_workflow_version
    ProjectWorkflowVersion.create!(project_id: @project_id, workflow: @workflow, version_prefix: @version_to_pin)
  end
end
