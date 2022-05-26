module Mutations
  class BaseMutation < GraphQL::Schema::Mutation
    null false
    argument_class Types::BaseArgument
    field_class Types::BaseField
  end
end
