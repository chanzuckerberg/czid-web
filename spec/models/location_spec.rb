require 'rails_helper'

RSpec.describe Location, type: :model do
  context "#find_or_new_by_fields" do
    before do
      user = create(:user)
      @project = create(:project, users: [user])
      @location_metadata_field = create(
        :metadata_field, name: 'mock_collection_location', base_type: MetadataField::LOCATION_TYPE
      )
      host_genome = create(:host_genome, name: "mock_host_genome")
      host_genome.metadata_fields << @location_metadata_field
      @sample = create(:sample, project: @project, name: "Mock sample", host_genome: host_genome)
    end

    it "should return existing location if it exists" do
      mock_location = create(:location, country_name: "USA")

      loc_info = { country_name: "USA" }
      location = Location.find_or_new_by_fields(loc_info)

      expect(location.new_record?).to eq(false)
      expect(location.id).to eq(mock_location.id)
    end

    it "should return newly created location if no osm_id or osm_type" do
      loc_info = { country_name: "USA" }
      location = Location.find_or_new_by_fields(loc_info)

      expect(location.new_record?).to eq(true)
      expect(location.country_name).to eq("USA")
    end

    it "should perform geosearch if osm_id or osm_type provided" do
      loc_info = { country_name: "USA", osm_id: 123, osm_type: "Relation" }

      expect(Location).to receive(:geosearch_by_osm_id).with(123, "Relation").exactly(1).times
                                                       .and_return([true, "mock_response"])
      expect(LocationHelper).to receive(:adapt_location_iq_response).with("mock_response").exactly(1).times
                                                                    .and_return(country_name: "Mock Country", osm_id: 123, osm_type: "Relation")

      location = Location.find_or_new_by_fields(loc_info)
      expect(location.new_record?).to eq(true)
      expect(location.country_name).to eq("Mock Country")
    end

    it "should return existing location if it matches geosearch response" do
      # There is an existing location for USA, but not California.
      mock_location = create(:location, country_name: "USA")
      loc_info = { country_name: "USA", state_name: "California", osm_id: 123, osm_type: "Relation" }

      expect(Location).to receive(:geosearch_by_osm_id).with(123, "Relation").exactly(1).times
                                                       .and_return([true, "mock_response"])
      expect(LocationHelper).to receive(:adapt_location_iq_response).with("mock_response").exactly(1).times
                                                                    .and_return(country_name: "USA", osm_id: 123, osm_type: "Relation")

      location = Location.find_or_new_by_fields(loc_info)
      expect(location.new_record?).to eq(false)
      expect(location.id).to eq(mock_location.id)
    end
  end

  context "#specificity_valid?" do
    it "should return true for non-human genomes non-specific locations" do
      is_valid = Location.specificity_valid?({
                                               geo_level: "country",
                                               country_name: "USA",
                                             }, "Mosquito")

      expect(is_valid).to eq(true)
    end

    it "should return true for non-human genomes and city-level locations" do
      is_valid = Location.specificity_valid?({
                                               geo_level: "city",
                                               country_name: "USA",
                                               state_name: "California",
                                               city_name: "San Francisco",
                                             }, "Mosquito")

      expect(is_valid).to eq(true)
    end

    it "should return false for human genomes and city-level locations" do
      is_valid = Location.specificity_valid?({
                                               geo_level: "city",
                                               country_name: "USA",
                                               state_name: "California",
                                               city_name: "San Francisco",
                                             }, "Human")

      expect(is_valid).to eq(false)
    end

    it "should return true for human genomes and non-specific locations" do
      is_valid = Location.specificity_valid?({
                                               geo_level: "country",
                                               country_name: "USA",
                                             }, "Human")

      expect(is_valid).to eq(true)
    end
  end
end
