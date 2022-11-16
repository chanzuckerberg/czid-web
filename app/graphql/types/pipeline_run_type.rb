module Types
  class PipelineRunType < Types::BaseObject
    field :id, Int, null: false
    field :adjustedRemainingReads, Int, null: true
    field :alertSent, Boolean, null: false
    field :alignmentConfigId, Int, null: true
    field :assembled, Int, null: true
    field :compressionRatio, Float, null: true
    field :createdAt, GraphQL::Types::ISO8601DateTime, null: true
    field :dagVars, String, null: true
    field :deprecated, Boolean, null: true
    field :errorMessage, String, null: true
    field :executedAt, GraphQL::Types::ISO8601DateTime, null: true
    field :finalized, Int, null: true
    field :fractionSubsampled, Float, null: true
    field :jobStatus, String, null: true
    field :knownUserError, String, null: true
    field :maxInputFragments, Int, null: true
    field :pipelineBranch, String, null: true
    field :pipelineCommit, String, null: true
    field :pipelineExecutionStrategy, String, null: true
    field :pipelineVersion, String, null: true
    field :qcPercent, Float, null: true
    field :resultsFinalized, Int, null: true
    field :s3OutputPrefix, String, null: true
    field :sampleId, Int, null: true
    field :sfnExecutionArn, String, null: true
    field :subsample, Int, null: true
    field :timeToFinalized, Int, null: true
    field :timeToResultsFinalized, Int, null: true
    field :totalErccReads, Int, null: true
    field :totalReads, Int, null: true
    field :truncated, Int, null: true
    field :unmappedReads, Int, null: true
    field :updatedAt, GraphQL::Types::ISO8601DateTime, null: false
    field :useTaxonWhitelist, Boolean, null: false
    field :wdlVersion, String, null: true
    field :alignmentConfigName, String, null: true
  end
end
