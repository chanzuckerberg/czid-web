require 'rails_helper'

RSpec.describe Location, type: :model do
  context "#location_api_request" do
    let(:query) { "search.php?addressdetails=1&normalizecity=1&q=UCSF" }
    let!(:api_geosearch_response) do
      [{
        "place_id" => "89640023",
        "osm_type" => "relation",
        "osm_id" => "34324395",
        "lat" => 37.76,
        # LocationIQ uses 'lon'
        "lon" => -122.45,
        "display_name" => "University of California, San Francisco, Parnassus Avenue, Inner Sunset, San Francisco, San Francisco City and County, California, 94131, USA",
        "address" => {
          "university" => "University of California, San Francisco",
          "city" => "San Francisco",
          "county" => "San Francisco City and County",
          "state" => "California",
          "country" => "USA",
          "country_code" => "us",
        },
      }]
    end

    context "when ENV does not have LOCATION_IQ_API_KEY set" do
      it "raises an error" do
        expect { Location.location_api_request(query) }.to raise_error(RuntimeError, "No location API key")
      end
    end

    context "when LOCATION_IQ_API_KEY is set" do
      before do
        allow(ENV).to receive(:[]).and_return("test_env_var_val")
        allow(ENV).to receive(:[]).with('LOCATION_IQ_API_KEY').and_return("location_iq_api_key")
      end

      context "when location api request response is success" do
        before do
          resp = double("Net::HTTPSuccess")
          allow(resp).to receive(:is_a?).with(Net::HTTPSuccess).and_return(true)
          allow(resp).to receive(:body).and_return(api_geosearch_response.to_json)
          allow(Net::HTTP).to receive(:start).and_return(resp)
        end

        it "receives a response from the location API" do
          location_resp = Location.location_api_request(query)
          expect(location_resp).to eq([true, api_geosearch_response])
        end
      end

      context "when location api request response is not found" do
        before do
          resp = double("Net::HTTPNotFound")
          allow(resp).to receive(:is_a?).with(Net::HTTPSuccess).and_return(false)
          allow(resp).to receive(:is_a?).with(Net::HTTPNotFound).and_return(true)
          allow(resp).to receive(:body).and_return({}.to_json)
          allow(Net::HTTP).to receive(:start).and_return(resp)
        end

        it "receives a response from the location API" do
          location_resp = Location.location_api_request(query)
          expect(location_resp).to eq([true, {}])
        end
      end
    end
  end

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
      mock_location = create(:location, country_name: "USA", osm_id: 123, locationiq_id: 89_640_023)

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
      mock_location = create(:location, country_name: "USA", osm_id: 123, locationiq_id: 89_640_023)
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
