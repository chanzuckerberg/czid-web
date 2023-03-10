# This service is used to control & determine the version of a workflow that is used for a given project.
# In the future, if the version of a workflow is deprecated or not runnable (by looking it up in WorkflowVersions) - we should display an error message to the user

class PipelineVersionControlService
  include ErrorHelper
  include Callable

  def initialize(project, workflow, version_prefix = nil)
    @project_id = project.id
    @workflow = workflow
    # version_prefix can be any MAJOR number (8), MAJOR.PATCH number (8.1), or MAJOR.PATCH.MINOR number (8.1.2)
    @version_prefix = version_prefix
  end

  def call
    if @version_prefix.nil?
      # If version_prefix is nil, simply return the latest version of the workflow (The project will not be pinned to any specific workflow version).
      return AppConfigHelper.get_workflow_version(@workflow)
    else
      # If the project isn't already pinned to a version for a workflow, pin the workflow for the project to the version_prefix specified
      pin_project_to_workflow_version unless ProjectWorkflowVersion.exists?(project_id: @project_id, workflow: @workflow)
    end

    prepare_specific_workflow_version_for_upload
  end

  private

  def prepare_specific_workflow_version_for_upload
    version, deprecated, runnable = fetch_latest_version_for_version_prefix.values_at(:version, :deprecated, :runnable)
    handle_workflow_verison_issues(version, deprecated, runnable)
    version
  end

  def pin_project_to_workflow_version
    ProjectWorkflowVersion.create!(project_id: @project_id, workflow: @workflow, version_prefix: @version_prefix)
  end

  def handle_workflow_verison_issues(version, deprecated, runnable)
    # In the future, surface the error to the user when the user is allowed to control their workflow versions
    # For now, we'll just raise an error
    if !runnable
      raise PipelineVersionControlErrors.workflow_version_not_runnable(@workflow, version)
    elsif deprecated
      raise PipelineVersionControlErrors.workflow_version_deprecated(@workflow, version)
    end
  end

  # Given a version_prefix, return the latest version of the workflow that matches the version_prefix
  # i.e. if the latest short-read-mngs version is 8.1.2 and version_prefix is 8.1, return 8.1.2
  def fetch_latest_version_for_version_prefix
    version = WorkflowVersion.arel_table[:version]
    workflow_versions = WorkflowVersion.where(workflow: @workflow).where(version.matches("#{@version_prefix}%"))

    if workflow_versions.empty?
      raise PipelineVersionControlErrors.workflow_version_not_found(@workflow, @version_prefix)
    end

    workflow_versions.order(version: :desc).first
  end
end
