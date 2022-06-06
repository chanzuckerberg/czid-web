module Types
  class PathogenType < Types::BaseObject
    field :name, String, null: false
    field :category, String, null: false
    field :tax_id, Integer, null: false
  end

  class PathogenListType < Types::BaseObject
    field :id, ID, null: false
    field :name, String, null: false
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false
    field :updated_at, GraphQL::Types::ISO8601DateTime, null: false
    field :pathogens, [Types::PathogenType], null: false
    field :citations, [String], null: false
    field :version, String, null: false
  end
end
