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

    # this causes a circular dependency error
    # "Circular dependency detected while autoloading constant Types::SampleType"
    # field :sample, SampleType, null: true, resolver_method: :input_file_type_sample
    # def input_file_type_sample
    #   input_file = InputFile.find(object["id"])
    #   input_file.sample
    # end
  end
end
