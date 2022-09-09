require 'graphql_auth_helpers'

module Types
  class BaseObject < GraphQL::Schema::Object
    extend GraphQLAuthHelpers

    edge_type_class(Types::BaseEdge)
    connection_type_class(Types::BaseConnection)
    field_class Types::BaseField
  end
end
