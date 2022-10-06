module Types
  class InputFileType < Types::BaseObject
    field :id, Int, null: false
    field :name, String, null: true
    field :presignedUrl, String, null: true
    field :sampleId, Int, null: false
    field :createdAt, GraphQL::Types::ISO8601DateTime, null: false
    field :updatedAt, GraphQL::Types::ISO8601DateTime, null: true
    field :sourceType, String, null: true
    field :source, String, null: true
    field :parts, String, null: true
    field :uploadClient, String, null: true
  end
end
