module Queries
  module SampleQuery
    extend ActiveSupport::Concern

    included do
      field :sample, Types::SampleType, null: false do
        argument :sampleId, Integer, required: true
      end
    end

    def sample(params)
      Sample.find(params[:sampleId])
    rescue ActiveRecord::RecordNotFound
      raise GraphQL::ExecutionError, "Sample not found"
    end
  end
end
