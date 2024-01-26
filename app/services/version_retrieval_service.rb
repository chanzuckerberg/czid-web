# Fetches the appropriate version of a workflow to run for samples in a given project
# and validates that the version is runnable.
# If the user specifies a prefix to use (not currently enabled),
# validate that prefix. If the project is pinned to a particular
# version for the workflow, return that version.
# Otherwise, return the latest version available for the workflow.
class VersionRetrievalService
  include Callable
  include ErrorHelper

  def initialize(project_id, workflow, user_specified_prefix = nil)
    @project_id = project_id
    @workflow = workflow
    @existing_version_prefix = ProjectWorkflowVersion.find_by(project_id: project_id, workflow: workflow)&.version_prefix
    # user_specified_prefix can be any MAJOR number (8), MAJOR.PATCH number (8.1), or MAJOR.PATCH.MINOR number (8.1.2)
    @user_specified_prefix = user_specified_prefix
  end

  def call
    fetch_and_validate_version_to_run
  end

  private

  def default_version
    if @workflow == AlignmentConfig::NCBI_INDEX
      AlignmentConfig.default_name
    elsif @workflow == HostGenome::HUMAN_HOST
      WorkflowVersion.latest_version_of(HostGenome::HUMAN_HOST)
    else
      AppConfigHelper.get_workflow_version(@workflow)
    end
  end

  def fetch_and_validate_version_to_run
    if @user_specified_prefix
      if @existing_version_prefix
        # In the future, we may want to explore allowing users to update their pinned version.
        # For now, this service does not allow the updating of ProjectWorkflowVersions.
        raise VersionControlErrors.project_workflow_version_already_pinned(@project_id, @workflow, @existing_version_prefix)
      else
        prepare_specific_workflow_version_for_upload(@user_specified_prefix)
      end
    elsif @existing_version_prefix
      prepare_specific_workflow_version_for_upload(@existing_version_prefix)
    else
      default_version
    end
  end

  def prepare_specific_workflow_version_for_upload(prefix)
    version, deprecated, runnable = fetch_latest_version_for_version_prefix(prefix).values_at(:version, :deprecated, :runnable)
    handle_workflow_version_issues(version, deprecated, runnable)
    version
  end

  def handle_workflow_version_issues(version, deprecated, runnable)
    # In the future, surface the error to the user when the user is allowed to control their workflow versions
    # For now, we'll just raise an error
    if !runnable
      raise VersionControlErrors.workflow_version_not_runnable(@workflow, version)
    elsif deprecated
      raise VersionControlErrors.workflow_version_deprecated(@workflow, version)
    end
  end

  # Given a version_prefix, return the latest version of the workflow that matches the version_prefix
  # i.e. if the latest short-read-mngs version is 8.1.2 and version_prefix is 8.1, return 8.1.2
  def fetch_latest_version_for_version_prefix(version_prefix)
    version = WorkflowVersion.arel_table[:version]
    workflow_versions = WorkflowVersion.where(workflow: @workflow).where(version.matches("#{version_prefix}%"))

    if workflow_versions.empty?
      raise VersionControlErrors.workflow_version_not_found(@workflow, version_prefix)
    end

    workflow_versions.order(version: :desc).first
  end
end
