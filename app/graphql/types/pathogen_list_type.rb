module Types
  class PathogenType < Types::BaseObject
    field :name, String, null: true
    field :category, String, null: true
    field :tax_id, Integer, null: true
  end

  class PathogenListType < Types::BaseObject
    field :id, ID, null: true
    field :name, String, null: true
    field :created_at, GraphQL::Types::ISO8601DateTime, null: true
    field :updated_at, GraphQL::Types::ISO8601DateTime, null: true
    field :pathogens, [Types::PathogenType], null: true
    field :citations, [String], null: true
    field :version, String, null: true
  end
end
