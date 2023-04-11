module Types
  class MutationType < Types::BaseObject
    field :createUser, mutation: ::Mutations::CreateUser do
      argument :email, String, required: true
      argument :name, String, required: false
      argument :institution, String, required: false
      argument :archetypes, String, required: false
      argument :segments, String, required: false
      argument :role, Int, required: false
      argument :send_activation, Boolean, required: false
    end
  end
end
