module Types
  class MutationType < Types::BaseObject
    field :createUser, mutation: ::Mutations::CreateUser do
      argument :email, String, required: true
      argument :name, String, required: true
      argument :institution, String, required: true
      argument :archetypes, String, required: true
      argument :segments, String, required: true
      argument :role, Int, required: true
      argument :send_activation, Boolean, required: true
    end
  end
end
