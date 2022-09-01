module Types
  class ProjectType < Types::BaseObject
    field :id, Integer, null: false
    field :name, String, null: false
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false
    field :updated_at, GraphQL::Types::ISO8601DateTime, null: false
    field :public_access, Integer, null: false
    field :days_to_keep_sample_private, Integer, null: false
    field :background_flag, Integer, null: true
    field :description, String, null: true
    field :subsample_default, Integer, null: true
    field :max_input_fragments_default, Integer, null: true
    field :creator, Types::UserType, null: true
    field :samples, [Types::SampleType], null: true
    field :total_sample_count, Integer, null: false
  end
end
