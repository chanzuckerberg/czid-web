module Queries
  module SampleReadsStatsListQuery
    extend GraphQL::Types::Relay::HasNodeField
    extend GraphQL::Types::Relay::HasNodesField
    extend ActiveSupport::Concern

    included do
      field :sample_reads_stats, Types::SampleReadsStatsListType, null: false do
        argument :sampleIds, [String], required: true
      end
    end

    def sample_reads_stats(params)
      current_user = context[:current_user]
      queried_sample_ids = (params[:sampleIds] || []).map(&:to_i)

      # No information is returned on samples they don't have access to.
      validated_sample_info = SampleAccessValidationService.call(queried_sample_ids, current_user)
      viewable_samples = validated_sample_info[:viewable_samples]

      results = {}
      if validated_sample_info[:error].nil?
        results[:sampleReadsStats] = ReadsStatsService.call(viewable_samples)
        results[:sampleReadsStats].each do |key, _value|
          results[:sampleReadsStats][key][:sampleId] = key
        end
        results[:sampleReadsStats] = results[:sampleReadsStats].values
      else
        raise :internal_server_error
      end

      results
    end
  end
end
