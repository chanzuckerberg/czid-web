module Types
  # TODO: this type is redundamt and should be removed
  # however it used in the QualityControl component.
  # A remnant from samples#index_v2.
  class DbSampleType < Types::BaseObject
    field :alignmentConfigName, String, null: true
    field :basespaceAccessToken, String, null: true
    field :clientUpdatedAt, GraphQL::Types::ISO8601DateTime, null: true
    field :createdAt, GraphQL::Types::ISO8601DateTime, null: false
    field :dagVars, String, null: true
    field :doNotProcess, Boolean, null: false
    field :hostGenomeId, Int, null: true
    field :hostGenomeName, String, null: true
    field :id, Int, null: false
    field :initialWorkflow, String, null: false
    field :inputFiles, [Types::InputFileType], null: false
    field :maxInputFragments, Int, null: true
    field :name, String, null: true
    field :pipelineBranch, String, null: true
    field :pipelineCommit, String, null: true
    field :pipelineExecutionStrategy, String, null: true
    field :privateUntil, GraphQL::Types::ISO8601DateTime, null: true
    field :projectId, Int, null: true
    field :s3Bowtie2IndexPath, String, null: true
    field :s3PreloadResultPath, String, null: true
    field :s3StarIndexPath, String, null: true
    field :sampleNotes, String, null: true
    field :status, String, null: true
    field :subsample, Int, null: true
    field :updatedAt, GraphQL::Types::ISO8601DateTime, null: false
    field :uploadedFromBasespace, Int, null: false
    field :uploadError, String, null: true
    field :userId, Int, null: false
    field :useTaxonWhitelist, Boolean, null: false
    field :webCommit, String, null: true
  end
end
