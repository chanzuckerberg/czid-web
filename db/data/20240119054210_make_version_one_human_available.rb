# frozen_string_literal: true

class MakeVersionOneHumanAvailable < ActiveRecord::Migration[6.1]
  ATTRIBUTE_NAME_HUMAN_VERSION = "human_host_genome"

  def up
    # WorkflowVersion is no longer an accruate name for the model.
    # It now means a broader category of any kind of attribute we want
    # to store multiple versions of rather than purely workflows.
    # A refactor to use a more descriptive name is on the to-do list.
    WorkflowVersion.create(workflow: ATTRIBUTE_NAME_HUMAN_VERSION, version: 1, deprecated: false, runnable: true)
  end

  def down
    human_version = WorkflowVersion.find_by(workflow: ATTRIBUTE_NAME_HUMAN_VERSION)
    human_version.destroy!
  end
end
