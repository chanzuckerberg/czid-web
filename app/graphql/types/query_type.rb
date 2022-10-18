module Types
  class QueryType < Types::BaseObject
    # Add `node(id: ID!) and `nodes(ids: [ID!]!)`
    include GraphQL::Types::Relay::HasNodeField
    include GraphQL::Types::Relay::HasNodesField
    include ParameterSanitization
    include SamplesHelper
    include Queries::PathogenListQuery
    include Queries::ProjectQuery
    include Queries::SampleListQuery
    include Queries::SampleReadsStatsListQuery

    # Add root-level fields here.
    # They will be entry points for queries on your schema.
    field :app_config, AppConfigType, null: true do
      argument :id, ID, required: true
    end

    field :user, UserType, null: false do
      argument :email, String, required: true
      argument :name, String, required: true
      argument :institution, String, required: true
      argument :archetypes, String, required: true
      argument :segments, String, required: true
      argument :role, Int, required: true
    end

    def app_config(id:)
      AppConfig.find(id)
    end
  end
end
