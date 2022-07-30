class IdseqSchema < GraphQL::Schema
  mutation(Types::MutationType)
  query(Types::QueryType)
  context_class IdseqContext

  rescue_from(ActiveRecord::RecordInvalid) do |err|
    raise GraphQL::ExecutionError, err.record.errors.full_messages.join('. ')
  end
end
