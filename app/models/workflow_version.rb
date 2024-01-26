class WorkflowVersion < ApplicationRecord
  # Returns latest value of `version` for specified workflow / versioned attribute.
  # Ex: WorkflowVersion.latest_version_of(HostGenome::HUMAN_HOST) ==> "2"
  # NOTE that this assumes the versions follow some kind of numeric-ish order,
  # like "8.2.3", "8.2.3-b9b4ab1", "8.2.4", etc. If the versions are arbitrary
  # strings that do not play nice with ORDER DESC, you'll need to handle that.
  def self.latest_version_of(workflow)
    latest = WorkflowVersion.select(:version).where(workflow: workflow).order(version: :desc).first
    if latest.nil?
      raise ErrorHelper::VersionControlErrors.workflow_name_not_found(workflow)
    end

    latest.version
  end
end
