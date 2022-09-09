class IdseqSchema < GraphQL::Schema
  mutation(Types::MutationType)
  query(Types::QueryType)
  context_class IdseqContext

  rescue_from(ActiveRecord::RecordInvalid) do |err|
    raise GraphQL::ExecutionError, err.record.errors.full_messages.join('. ')
  end

  # handles cases when `authorized?` returns false
  def self.unauthorized_object(error)
    # Add a top-level error to the response instead of returning nil:
    raise GraphQL::ExecutionError, "An object of type #{error.type.graphql_name} was hidden due to permissions"
  end
end
