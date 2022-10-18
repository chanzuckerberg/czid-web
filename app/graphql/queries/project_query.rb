module Queries
  module ProjectQuery
    extend ActiveSupport::Concern

    included do
      field :project, Types::ProjectType, null: false do
        argument :id, Integer, required: true
      end
    end

    def project(id)
      current_power = context[:current_power]
      project = Project.find(id[:id])
      samples = current_power.project_samples(project).order(id: :desc)

      return {
        id: project.id,
        name: project.name,
        description: project.description,
        public_access: project.public_access.to_i,
        created_at: project.created_at,
        total_sample_count: samples.count,
      }
    end
  end
end
