class IdseqContext < GraphQL::Query::Context
  def current_user
    self[:current_user]
  end
end
