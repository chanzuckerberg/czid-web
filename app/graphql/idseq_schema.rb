class IdseqSchema < GraphQL::Schema
  mutation(Types::MutationType)
  query(Types::QueryType)
  context_class IdseqContext
end
