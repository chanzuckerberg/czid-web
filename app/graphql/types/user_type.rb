module Types
  class UserType < Types::BaseObject
    field :id, ID, null: false
    field :email, String, null: false
    field :name, String, null: false
    field :role, Int, null: false
    field :institution, String, null: false
    field :created_by_user_id, GraphQL::Types::BigInt, null: false
    field :archetypes, String, null: false
    field :segments, String, null: false

    # These fields are left here commnented out
    # to make it easier to add them in as we need them

    # field :phylo_trees_count, Int, null: false
    # field :visualizations_count, Int, null: false
    # field :samples_count, Int, null: false
    # field :favorite_projects_count, Int, null: false
    # field :favorites_count, Int, null: false
    # field :created_at, GraphQL::Types::ISO8601DateTime, null: false
    # field :updated_at, GraphQL::Types::ISO8601DateTime, null: false
    # field :sign_in_count, Int, null: false
    # field :current_sign_in_at, GraphQL::Types::ISO8601DateTime, null: false
    # field :last_sign_in_at, GraphQL::Types::ISO8601DateTime, null: false
    # field :current_sign_in_ip, String, null: false
    # field :last_sign_in_ip, String, null: false
  end
end
