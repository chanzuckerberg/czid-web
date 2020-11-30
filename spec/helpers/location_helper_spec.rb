# See deprecated test/helpers/location_helper_test.rb

require "rails_helper"
require_relative "../../test/test_helpers/location_test_helper.rb"

RSpec.describe LocationHelper, type: :helper do
  describe "#sanitize_name" do
    it "sanitizes a name" do
      name = "California, USA; DROP TABLE USERS; <div></div>"
      result = LocationHelper.sanitize_name(name)
      expect(result).to eq("California, USA DROP TABLE USERS divdiv")
    end
  end

  describe "#truncate_name" do
    it "truncates a name" do
      name = "Chania, Chania Municipality, Chania Regional Unit, Region of Crete, Crete, 73135, Greece"
      result = LocationHelper.truncate_name(name)
      expect(result).to eq("Chania, 73135, Greece")
    end

    it "doesn't truncate shorter names" do
      name = "Alaska, USA"
      result = LocationHelper.truncate_name(name)
      expect(result).to eq("Alaska, USA")
    end
  end

  # TODO: These tests would be improved with Factories and SamplesHelper tests
  describe "#sample_dimensions" do
    it "gets and formats sample location dimensions" do
      sample_ids = [1, 2, 3]
      field_name = "collection_location_v2"
      mock_filtered = {
        [nil, "Alaska, USA", "USA", "Alaska, USA"] => 1,
        [nil, "Chania, Chania Municipality, Chania Regional Unit, Region of Crete, Crete, 73135, Greece", "Greece", "Crete, Greece", "Chania, Crete, Greece", "Chania, Chania Municipality, Chania Regional Unit, Region of Crete, Crete, 73135, Greece"] => 1,
        [nil, "Hanoi, Vietnam", "Vietnam", "Hanoi, Vietnam"] => 1,
        [nil, "Redwood City, San Mateo County, California, USA", "USA", "California", "San Mateo County, California, USA", "Redwood City, San Mateo County, California, USA"] => 112,
        [nil, "Zimbabwe"] => 1,
      }
      allow(SamplesHelper).to receive_message_chain(:samples_by_metadata_field, :count).and_return(mock_filtered)

      expected = [
        { value: "Alaska, USA", text: "Alaska, USA", count: 1, parents: ["USA"] },
        { value: "Chania, Chania Municipality, Chania Regional Unit, Region of Crete, Crete, 73135, Greece", text: "Chania, 73135, Greece", count: 1, parents: ["Greece", "Crete, Greece", "Chania, Crete, Greece"] },
        { value: "Hanoi, Vietnam", text: "Hanoi, Vietnam", count: 1, parents: ["Vietnam"] },
        { value: "Redwood City, San Mateo County, California, USA", text: "Redwood City, California, USA", count: 112, parents: ["USA", "California", "San Mateo County, California, USA"] },
        { value: "Zimbabwe", text: "Zimbabwe", count: 1, parents: [] },
        { value: "not_set", text: "Unknown", count: 740 },
      ]
      result = LocationHelper.sample_dimensions(sample_ids, field_name, 856)
      expect(result).to eq(expected)
    end
  end

  # TODO: These tests would be improved with Factories and SamplesHelper tests
  describe "#project_dimensions" do
    it "gets and formats project location dimensions" do
      field_name = "collection_location_v2"
      mock_filtered = {
        [nil, "Alaska, USA", "USA", "Alaska, USA"] => 1,
        [nil, "Chania, Chania Municipality, Chania Regional Unit, Region of Crete, Crete, 73135, Greece", "Greece", "Crete, Greece", "Chania, Crete, Greece", "Chania, Chania Municipality, Chania Regional Unit, Region of Crete, Crete, 73135, Greece"] => 1,
        [nil, "Hanoi, Vietnam", "Vietnam", "Hanoi, Vietnam"] => 1,
        [nil, "Redwood City, San Mateo County, California, USA", "USA", "California", "San Mateo County, California, USA", "Redwood City, San Mateo County, California, USA"] => 1,
        [nil, "Zimbabwe"] => 1,
      }
      allow(SamplesHelper).to receive_message_chain(:samples_by_metadata_field, :includes, :distinct, :count).and_return(mock_filtered)

      expected = [
        { value: "Alaska, USA", text: "Alaska, USA", count: 1, parents: ["USA"] },
        { value: "Chania, Chania Municipality, Chania Regional Unit, Region of Crete, Crete, 73135, Greece", text: "Chania, 73135, Greece", count: 1, parents: ["Greece", "Crete, Greece", "Chania, Crete, Greece"] },
        { value: "Hanoi, Vietnam", text: "Hanoi, Vietnam", count: 1, parents: ["Vietnam"] },
        { value: "Redwood City, San Mateo County, California, USA", text: "Redwood City, California, USA", count: 1, parents: ["USA", "California", "San Mateo County, California, USA"] },
        { value: "Zimbabwe", text: "Zimbabwe", count: 1, parents: [] },
      ]
      result = LocationHelper.project_dimensions([1, 2, 3], field_name)
      expect(result).to eq(expected)
    end
  end

  describe "#filter_by_name" do
    it "filters samples by a location name query with location results" do
      query_text = "Washington"
      expected = [Sample.new]
      samples = double()

      expect(Location).to receive_message_chain(:where, :pluck, :group_by, :map, :to_h).and_return(country: [147], state: [153], city: [188])
      expect(samples).to receive(:includes).with(metadata: :location).and_return(samples)
      expect(samples).to receive(:where).with("`metadata`.`string_validated_value` IN (BINARY ?) OR `locations`.`country_id` IN (?) OR `locations`.`state_id` IN (?) OR `locations`.`city_id` IN (?)", query_text, [147], [153], [188]).and_return(expected)

      result = LocationHelper.filter_by_name(samples, query_text)
      expect(result).to eq(expected)
    end

    it "filters samples by a location name query with NO location results" do
      query_text = "Washington"
      expected = [Sample.new]
      samples = double()

      expect(Location).to receive(:where).and_return([])
      expect(samples).to receive(:includes).with(metadata: :location).and_return(samples)
      expect(samples).to receive(:where).with("`metadata`.`string_validated_value` IN (BINARY ?)", query_text).and_return(expected)

      result = LocationHelper.filter_by_name(samples, query_text)
      expect(result).to eq(expected)
    end
  end

  describe "#adapt_location_iq_response" do
    it "formats a response for a city name without subdivision" do
      expected = LocationTestHelper::FORMATTED_GEOSEARCH_DHAKA_RESPONSE[0].symbolize_keys
      result = LocationHelper.adapt_location_iq_response(LocationTestHelper::API_GEOSEARCH_DHAKA_RESPONSE[0])
      expect(result).to eq(expected)
    end

    it "formats a response for a short country name without truncation" do
      expected = LocationTestHelper::FORMATTED_GEOSEARCH_UGANDA_RESPONSE[0].symbolize_keys
      result = LocationHelper.adapt_location_iq_response(LocationTestHelper::API_GEOSEARCH_UGANDA_RESPONSE[0])
      expect(result).to eq(expected)
    end

    it "recognizes a matching 'type' field for determining geo level" do
      expected = LocationTestHelper::FORMATTED_GEOSEARCH_RESPONSE_WITH_TYPE[0].symbolize_keys
      actual = LocationHelper.adapt_location_iq_response(LocationTestHelper::API_GEOSEARCH_RESPONSE_WITH_TYPE[0])
      expect(actual).to eq(expected)
    end
  end

  describe "#normalize_location_name" do
    it "normalizes name aliases to a common name" do
      name = "United States of America"
      expected = "USA"
      stub_const("LOCATION_NAME_ALIASES", Location::COUNTRY_LEVEL => { name => expected })

      result = LocationHelper.normalize_location_name(name, Location::COUNTRY_LEVEL)
      expect(result).to eq(expected)
    end

    it "doesn't modify names without an alias" do
      name = "Nevada"
      stub_const("LOCATION_NAME_ALIASES", {})
      result = LocationHelper.normalize_location_name(name, Location::STATE_LEVEL)
      expect(result).to eq(name)
    end
  end

  describe "#handle_external_search_results" do
    context "more autocomplete results than search results" do
      before do
        autocomplete_results =
          LocationTestHelper::API_GEOSEARCH_CALIFORNIA_RESPONSE +
          LocationTestHelper::API_GEOSEARCH_SF_COUNTY_RESPONSE +
          LocationTestHelper::API_GEOSEARCH_DHAKA_RESPONSE
        search_results = LocationTestHelper::API_GEOSEARCH_USA_RESPONSE + LocationTestHelper::API_GEOSEARCH_UGANDA_RESPONSE
        @raw_results = {
          Location::GEOSEARCH_ACTIONS[0] => autocomplete_results,
          Location::GEOSEARCH_ACTIONS[1] => search_results,
        }
      end

      it "zips/interpolates autocomplete and geosearch results" do
        actual = LocationHelper.handle_external_search_results(@raw_results)
        expected = [
          LocationTestHelper::FORMATTED_GEOSEARCH_CALIFORNIA_RESPONSE,
          LocationTestHelper::FORMATTED_GEOSEARCH_USA_RESPONSE,
          LocationTestHelper::FORMATTED_GEOSEARCH_SF_COUNTY_RESPONSE,
          LocationTestHelper::FORMATTED_GEOSEARCH_UGANDA_RESPONSE,
          LocationTestHelper::FORMATTED_GEOSEARCH_DHAKA_RESPONSE,
        ].flatten

        expected_names = expected.map { |r| r.symbolize_keys[:name] }
        actual_names = actual.pluck(:name)
        expect(actual_names).to eq(expected_names)
      end

      it "filters by OSM search type" do
        raw_results = {
          Location::GEOSEARCH_ACTIONS[0] => LocationTestHelper::API_GEOSEARCH_NODE_RESPONSE +
                                            LocationTestHelper::API_GEOSEARCH_CALIFORNIA_RESPONSE,
        }
        actual = LocationHelper.handle_external_search_results(raw_results)
        expected = [LocationTestHelper::FORMATTED_GEOSEARCH_CALIFORNIA_RESPONSE[0].symbolize_keys]
        expect(actual).to eq(expected)
      end

      it "de-duplicates by name/geo_level, and osm_id" do
        raw_results = {
          Location::GEOSEARCH_ACTIONS[0] => LocationTestHelper::API_GEOSEARCH_CALIFORNIA_RESPONSE + LocationTestHelper::API_GEOSEARCH_USA_RESPONSE,
          Location::GEOSEARCH_ACTIONS[1] => LocationTestHelper::API_GEOSEARCH_CALIFORNIA_RESPONSE + LocationTestHelper::API_GEOSEARCH_USA_ALTERNATIVE_RESPONSE,
        }
        actual = LocationHelper.handle_external_search_results(raw_results)
        expected = [LocationTestHelper::FORMATTED_GEOSEARCH_CALIFORNIA_RESPONSE, LocationTestHelper::FORMATTED_GEOSEARCH_USA_RESPONSE].flatten.map(&:symbolize_keys)
        expect(actual).to eq(expected)
      end
    end
  end
end
