module Types
  class MngsRunInfoType < Types::BaseObject
    field :totalRuntime, Int, null: true
    field :withAssembly, Int, null: true
    field :resultStatusDescription, String, null: true
    field :finalized, Int, null: true
    field :reportReady, Boolean, null: true
    field :createdAt, GraphQL::Types::ISO8601DateTime, null: true
  end
end
