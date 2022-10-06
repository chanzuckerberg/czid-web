module Types
  class SampleMetadataType < Types::BaseObject
    field :collectionDate, String, null: true
    # field :collectionLocationV2, Types::SampleCollectionLocationType, null: true
    field :collectionLocationV2, String, null: true
    field :nucleotideType, String, null: true
    field :sampleType, String, null: true
    field :waterControl, String, null: true
  end
end
