module Types
  class SampleCollectionLocationType < Types::BaseObject
    field :name, String, null: false
    field :geoLevel, String, null: false
    field :countryName, String, null: false
    field :stateName, String, null: false
    field :subdivisionName, String, null: false
    field :cityName, String, null: false
    field :lat, Float, null: true
    field :lng, Float, null: true
    field :countryId, Int, null: true
    field :stateId, Int, null: true
    field :subdivisionId, Int, null: true
    field :cityId, Int, null: true
  end
end
