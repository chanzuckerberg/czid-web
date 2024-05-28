require 'factory_bot'
require_relative 'seed_resource'

module SeedResource
  class WorkflowVersions < Base
    def seed
      FactoryBot.find_or_create(
        :workflow_version,
        workflow: "human_host_genome",
        version: "1",
        deprecated: false,
        runnable: true
      )

      FactoryBot.find_or_create(
        :workflow_version,
        workflow: "human_host_genome",
        version: "2",
        deprecated: false,
        runnable: true
      )
    end
  end
end
