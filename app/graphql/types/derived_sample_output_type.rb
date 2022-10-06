module Types
  class DerivedSampleOutputType < Types::BaseObject
    field :pipelineRun, Types::PipelineRunType, null: true
    field :hostGenomeName, String, null: false
    field :projectName, String, null: false
    field :summaryStats, Types::SampleSummaryStatsType, null: true
  end
end
