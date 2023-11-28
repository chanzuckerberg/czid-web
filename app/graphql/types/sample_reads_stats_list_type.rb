module Types
  class SampleStepsType < Types::BaseObject
    field :name, String, null: true
    field :readsAfter, Int, null: true
  end

  class SampleReadsStatsType < Types::BaseObject
    field :sampleId, ID, null: false
    field :initialReads, Int, null: true
    field :name, String, null: true
    field :pipelineVersion, String, null: true
    field :wdlVersion, String, null: true
    field :steps, [Types::SampleStepsType], null: true
  end

  class SampleReadsStatsListType < Types::BaseObject
    field :sampleReadsStats, [Types::SampleReadsStatsType], null: false
  end
end
