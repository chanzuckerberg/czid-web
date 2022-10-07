module Types
  class SampleSteps < Types::BaseObject
    field :name, String, null: true
    field :readsAfter, Int, null: true
  end

  class SampleReadsStatsType < Types::BaseObject
    field :sampleId, Int, null: false
    field :initialReads, Int, null: true
    field :name, String, null: true
    field :pipelineVersion, String, null: true
    field :sampleId, Int, null: true
    field :wdlVersion, String, null: true
    field :steps, [Types::SampleSteps], null: true
  end

  class SampleReadsStatsListType < Types::BaseObject
    field :sampleReadsStats, [Types::SampleReadsStatsType], null: false
  end
end
