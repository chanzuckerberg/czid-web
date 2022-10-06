module Types
  class SampleSummaryStatsType < Types::BaseObject
    field :adjustedRemainingReads, Int, null: true
    field :compressionRatio, Float, null: true
    field :qcPercent, Float, null: true
    field :percentRemaining, Float, null: true
    field :unmappedReads, Int, null: true
    field :insertSizeMean, Float, null: true
    field :insertSizeStandardDeviation, Float, null: true
    field :lastProcessedAt, GraphQL::Types::ISO8601DateTime, null: true
    field :readsAfterStar, Int, null: true
    field :readsAfterTrimmomatic, Int, null: true
    field :readsAfterPriceseq, Int, null: true
    field :readsAfterCzidDedup, Int, null: true
  end
end
