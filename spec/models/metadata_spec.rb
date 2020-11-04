require 'rails_helper'

RSpec.describe Metadatum, type: :model do
  let(:memory_store) { ActiveSupport::Cache.lookup_store(:memory_store) }
  let(:cache) { Rails.cache }

  before do
    allow(Rails).to receive(:cache).and_return(memory_store)
    Rails.cache.clear
  end

  context "#check_and_set_location_type" do
    let(:location_name) { "test_location" }

    before do
      user = create(:user)
      @project = create(:project, users: [user])
      @location_metadata_field = create(
        :metadata_field, name: 'mock_collection_location', base_type: MetadataField::LOCATION_TYPE
      )
      @host_genome = create(:host_genome, name: "mock_host_genome")
      @host_genome.metadata_fields << @location_metadata_field
      @sample = create(:sample, project: @project, name: "Mock sample", host_genome: @host_genome)
    end

    it "should pass in normal case" do
      location = { name: location_name, locationiq_id: 100 }

      # Test with location already created.
      mock_location = create(:location, osm_id: 200, locationiq_id: 101)
      # The following functions are expected to be called.
      expect(Location).to receive(:find_or_new_by_fields).exactly(1).times
                                                         .and_return(mock_location)

      location_metadata = Metadatum.new(
        raw_value: JSON.dump(location),
        sample: @sample,
        metadata_field: @location_metadata_field,
        key: "mock_collection_location"
      )

      location_metadata.save!
      expect(location_metadata.string_validated_value).to eq(nil)
      expect(location_metadata.raw_value).to eq(nil)
      expect(location_metadata.location_id).to eq(mock_location.id)
    end

    it "should save unwrapped strings without error" do
      location_metadata = Metadatum.new(
        raw_value: "mock_location",
        sample: @sample,
        metadata_field: @location_metadata_field,
        key: "mock_collection_location"
      )

      location_metadata.save!
      expect(location_metadata.string_validated_value).to eq("mock_location")
      expect(location_metadata.location_id).to eq(nil)
    end

    it "should save plain text selection without error" do
      location_metadata = Metadatum.new(
        raw_value: JSON.dump(name: "mock_location"),
        sample: @sample,
        metadata_field: @location_metadata_field,
        key: "mock_collection_location"
      )

      location_metadata.save!
      expect(location_metadata.string_validated_value).to eq("mock_location")
      expect(location_metadata.location_id).to eq(nil)
    end

    it "should succeed if location is already linked" do
      location = create(:location, osm_id: 200, locationiq_id: 100)

      location_metadata = Metadatum.new(
        sample: @sample,
        metadata_field: @location_metadata_field,
        key: "mock_collection_location",
        location: location
      )

      location_metadata.save!
      expect(location_metadata.location_id).to eq(location.id)
    end

    it "should refetch adjusted location if refetch_adjusted_location is set" do
      location = { name: location_name, locationiq_id: 100, refetch_adjusted_location: true }

      # Test with location already created.
      mock_location = create(:location, osm_id: 200, locationiq_id: 101)
      # The following functions are expected to be called.
      expect(Location).to receive(:refetch_adjusted_location).exactly(1).times
                                                             .and_return(mock_location)

      location_metadata = Metadatum.new(
        raw_value: JSON.dump(location),
        sample: @sample,
        metadata_field: @location_metadata_field,
        key: "mock_collection_location"
      )

      location_metadata.save!
      expect(location_metadata.string_validated_value).to eq(nil)
      expect(location_metadata.raw_value).to eq(nil)
      expect(location_metadata.location_id).to eq(mock_location.id)
    end

    it "should run check_and_fetch_parents if location isn't already created" do
      location = { name: location_name, locationiq_id: 100, refetch_adjusted_location: true }

      # Test with location not yet created.
      mock_location = Location.new(name: location_name, locationiq_id: 101, osm_id: 200)
      # The following functions are expected to be called.
      expect(Location).to receive(:refetch_adjusted_location).exactly(1).times
                                                             .and_return(mock_location)
      expect(Location).to receive(:check_and_fetch_parents).exactly(1).times
                                                           .and_return(mock_location)

      location_metadata = Metadatum.new(
        raw_value: JSON.dump(location),
        sample: @sample,
        metadata_field: @location_metadata_field,
        key: "mock_collection_location"
      )

      location_metadata.save!
      expect(location_metadata.string_validated_value).to eq(nil)
      expect(location_metadata.raw_value).to eq(nil)
      created_location = Location.find(location_metadata.location_id)
      expect(created_location.locationiq_id).to eq(101)
      expect(created_location.osm_id).to eq(200)
    end

    # This tests the cache by saving the same raw_value twice.
    it "should return correct response if called twice with the same raw_value" do
      location = { name: location_name, locationiq_id: 100, refetch_adjusted_location: true }

      mock_location = Location.new(name: location_name, locationiq_id: 101, osm_id: 200)

      # Note that the functions below are expected to only be called ONCE, even though we save TWO
      # metadata objects. This proves that the cache is working.
      expect(Location).to receive(:refetch_adjusted_location).exactly(1).times
                                                             .and_return(mock_location)
      expect(Location).to receive(:check_and_fetch_parents).exactly(1).times
                                                           .and_return(mock_location)

      location_metadata = Metadatum.new(
        raw_value: JSON.dump(location),
        sample: @sample,
        metadata_field: @location_metadata_field,
        key: "mock_collection_location"
      )

      location_metadata.save!
      expect(location_metadata.string_validated_value).to eq(nil)
      expect(location_metadata.raw_value).to eq(nil)
      created_location = Location.find(location_metadata.location_id)
      expect(created_location.locationiq_id).to eq(101)
      expect(created_location.osm_id).to eq(200)

      # Need to create a second sample so that location metadatum can satisfy uniqueness constraints.
      @sample_two = create(:sample, project: @project, name: "Mock sample Two", host_genome: @host_genome)
      location_metadata_two = Metadatum.new(
        raw_value: JSON.dump(location),
        sample: @sample_two,
        metadata_field: @location_metadata_field,
        key: "mock_collection_location"
      )

      # Ensure that the same expected values are returned.
      location_metadata_two.save!
      expect(location_metadata_two.string_validated_value).to eq(nil)
      expect(location_metadata_two.raw_value).to eq(nil)
      created_location = Location.find(location_metadata_two.location_id)
      expect(created_location.locationiq_id).to eq(101)
      expect(created_location.osm_id).to eq(200)
    end

    it "should throw error if location for Human sample is too specific" do
      host_genome_human = HostGenome.find_by(name: "Human")
      host_genome_human.metadata_fields << @location_metadata_field
      @human_sample = create(:sample, project: @project, name: "Mock sample human", host_genome: host_genome_human)

      location = { name: location_name, locationiq_id: 100, city_name: "Mock City", geo_level: "city" }

      location_metadata = Metadatum.new(
        raw_value: JSON.dump(location),
        sample: @human_sample,
        metadata_field: @location_metadata_field,
        key: "mock_collection_location"
      )

      expect do
        location_metadata.save!
      end.to raise_error(ActiveRecord::RecordInvalid)
    end

    it "should throw error if the location raw value is missing info" do
      insufficient_raw_value = { locationiq_id: 123 }
      location_metadata = Metadatum.new(
        raw_value: JSON.dump(insufficient_raw_value),
        sample: @sample,
        metadata_field: @location_metadata_field,
        key: "mock_collection_location"
      )

      expect { location_metadata.save! }.to raise_error(ActiveRecord::RecordInvalid)
      expect(location_metadata.errors.full_messages[0]).to include(ErrorHelper::MetadataValidationErrors::INVALID_LOCATION)
    end
  end
end
