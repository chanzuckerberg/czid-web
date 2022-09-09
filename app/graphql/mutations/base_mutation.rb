require 'graphql_auth_helpers'

module Mutations
  class BaseMutation < GraphQL::Schema::Mutation
    extend GraphQLAuthHelpers

    null false
    argument_class Types::BaseArgument
    field_class Types::BaseField
  end
end
