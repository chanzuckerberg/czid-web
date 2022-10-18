module Types
  class PathogenType < Types::BaseObject
    field :name, String, null: true
    field :category, String, null: true
    field :tax_id, Integer, null: true
  end
end
