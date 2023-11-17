module Types
  class MutationType < Types::BaseObject
    field :createUser, mutation: ::Mutations::CreateUser do
      argument :email, String, required: true
    end
  end
end
