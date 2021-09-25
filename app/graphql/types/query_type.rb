module Types
  class QueryType < Types::BaseObject
    # Add `node(id: ID!) and `nodes(ids: [ID!]!)`
    include GraphQL::Types::Relay::HasNodeField
    include GraphQL::Types::Relay::HasNodesField

    # Add root-level fields here.
    # They will be entry points for queries on your schema.
    field :app_config, AppConfigType, null: true do
      argument :id, ID, required: true
    end

    def app_config(id:)
      AppConfig.find(id)
    end
  end
end
